from pyln.client import Millisatoshi, Plugin
from sqlalchemy.orm import Session

from plugins.mpay.data.network_info import NetworkInfo
from plugins.mpay.data.router import Router
from plugins.mpay.data.routes import Routes
from plugins.mpay.db.db import Database
from plugins.mpay.db.models import Payment
from plugins.mpay.pay.channels import ChannelsHelper
from plugins.mpay.pay.excludes import Excludes, ExcludesPayment
from plugins.mpay.pay.invoice_check import InvoiceChecker
from plugins.mpay.pay.payer import Payer
from plugins.mpay.pay.sendpay import STATUS_COMPLETE, PaymentHelper, PaymentResult
from plugins.mpay.utils import fee_with_percent, format_error


class MPay:
    default_max_fee_perc: float = 0.05

    pl: Plugin

    _db: Database

    _router: Router
    _pay: PaymentHelper
    _excludes: Excludes
    _channels: ChannelsHelper
    _network_info: NetworkInfo
    _invoice_checker: InvoiceChecker

    def __init__(self, pl: Plugin, db: Database, routes: Routes) -> None:
        self.pl = pl
        self._db = db
        self._excludes = Excludes()
        self._pay = PaymentHelper(pl)
        self._network_info = NetworkInfo(pl)
        self._invoice_checker = InvoiceChecker(pl)
        self._channels = ChannelsHelper(pl, self._network_info)
        self._router = Router(pl, routes, self._network_info)

    def init(self) -> None:
        self._network_info.init()
        self._invoice_checker.init()

    def reset_excludes(self) -> None:
        self.pl.log("Resetting temporary exclude list")
        self._excludes.reset()

    def pay(
        self,
        bolt11: str,
        max_fee: int | None,
        exempt_fee: int,
        timeout: int,
        max_delay: int | None = None,
    ) -> PaymentResult:
        self._invoice_checker.check(bolt11)
        dec = self.pl.rpc.decode(bolt11)

        amount = dec["amount_msat"]
        payment_hash = dec["payment_hash"]

        already_paid = self._check_for_paid(payment_hash)
        if already_paid is not None:
            return already_paid

        with Session(self._db.engine) as session:
            payment = Payment(
                destination=dec["payee"], payment_hash=payment_hash, amount=int(amount)
            )
            session.add(payment)
            session.commit()

            max_fee = self._calculate_fee(amount, max_fee, exempt_fee)
            self.pl.log(
                f"Paying {payment_hash} for {amount} with max fee "
                f"{fee_with_percent(dec['amount_msat'], max_fee)}"
            )

            try:
                return Payer(
                    self.pl,
                    self._router,
                    self._pay,
                    self._channels,
                    self._network_info,
                    ExcludesPayment(self._excludes),
                    session,
                    payment,
                    bolt11,
                    dec,
                    max_fee,
                    timeout,
                    max_delay,
                ).start()
            except BaseException as e:
                if payment.ok or payment.ok is None:
                    payment.ok = False
                    session.commit()

                self.pl.log(f"Payment {payment_hash} failed: {format_error(e)}", level="warn")

                raise

    # Paying an already paid invoice would result in instant success regardless
    # of the route through which the payment was attempted.
    # Therefore, we have to check for already paid invoices first,
    # to not distort our success heuristics
    def _check_for_paid(self, payment_hash: str) -> PaymentResult | None:
        res = [
            entry
            for entry in self.pl.rpc.listpays(payment_hash=payment_hash, status="complete")["pays"]
            if "preimage" in entry
        ]

        if len(res) == 0:
            return None

        amount = Millisatoshi(sum(int(pay["amount_msat"]) for pay in res))
        amount_sent = Millisatoshi(sum(int(pay["amount_sent_msat"]) for pay in res))

        return PaymentResult(
            destination=res[0]["destination"],
            payment_hash=payment_hash,
            payment_preimage=res[0]["preimage"],
            parts=len(res),
            amount_msat=amount,
            amount_sent_msat=amount_sent,
            fee_msat=amount_sent - amount,
            status=STATUS_COMPLETE,
            created_at=res[0]["created_at"],
            time=0,
        )

    def _calculate_fee(
        self, amount: Millisatoshi, max_fee: int | None, exempt_fee: int
    ) -> Millisatoshi:
        if max_fee is not None:
            return Millisatoshi(max_fee)

        calculated = Millisatoshi(round((int(amount) * self.default_max_fee_perc) / 100))
        self.pl.log(f"Calculated default max fee of {calculated}")

        exemption = Millisatoshi(exempt_fee)
        if calculated < exemption:
            self.pl.log(f"Using exempt fee of {exemption}")
            return exemption

        return calculated
