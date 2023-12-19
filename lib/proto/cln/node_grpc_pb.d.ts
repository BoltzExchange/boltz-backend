// package: cln
// file: cln/node.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from '@grpc/grpc-js';
import * as cln_node_pb from '../cln/node_pb';
import * as cln_primitives_pb from '../cln/primitives_pb';

interface INodeService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  getinfo: INodeService_IGetinfo;
  listPeers: INodeService_IListPeers;
  listFunds: INodeService_IListFunds;
  sendPay: INodeService_ISendPay;
  listChannels: INodeService_IListChannels;
  addGossip: INodeService_IAddGossip;
  autoCleanInvoice: INodeService_IAutoCleanInvoice;
  checkMessage: INodeService_ICheckMessage;
  close: INodeService_IClose;
  connectPeer: INodeService_IConnectPeer;
  createInvoice: INodeService_ICreateInvoice;
  datastore: INodeService_IDatastore;
  datastoreUsage: INodeService_IDatastoreUsage;
  createOnion: INodeService_ICreateOnion;
  delDatastore: INodeService_IDelDatastore;
  delExpiredInvoice: INodeService_IDelExpiredInvoice;
  delInvoice: INodeService_IDelInvoice;
  invoice: INodeService_IInvoice;
  listDatastore: INodeService_IListDatastore;
  listInvoices: INodeService_IListInvoices;
  sendOnion: INodeService_ISendOnion;
  listSendPays: INodeService_IListSendPays;
  listTransactions: INodeService_IListTransactions;
  pay: INodeService_IPay;
  listNodes: INodeService_IListNodes;
  waitAnyInvoice: INodeService_IWaitAnyInvoice;
  waitInvoice: INodeService_IWaitInvoice;
  waitSendPay: INodeService_IWaitSendPay;
  newAddr: INodeService_INewAddr;
  withdraw: INodeService_IWithdraw;
  keySend: INodeService_IKeySend;
  fundPsbt: INodeService_IFundPsbt;
  sendPsbt: INodeService_ISendPsbt;
  signPsbt: INodeService_ISignPsbt;
  utxoPsbt: INodeService_IUtxoPsbt;
  txDiscard: INodeService_ITxDiscard;
  txPrepare: INodeService_ITxPrepare;
  txSend: INodeService_ITxSend;
  listPeerChannels: INodeService_IListPeerChannels;
  listClosedChannels: INodeService_IListClosedChannels;
  decodePay: INodeService_IDecodePay;
  decode: INodeService_IDecode;
  disconnect: INodeService_IDisconnect;
  feerates: INodeService_IFeerates;
  fetchInvoice: INodeService_IFetchInvoice;
  fundChannel: INodeService_IFundChannel;
  getRoute: INodeService_IGetRoute;
  listForwards: INodeService_IListForwards;
  listPays: INodeService_IListPays;
  listHtlcs: INodeService_IListHtlcs;
  ping: INodeService_IPing;
  sendCustomMsg: INodeService_ISendCustomMsg;
  setChannel: INodeService_ISetChannel;
  signInvoice: INodeService_ISignInvoice;
  signMessage: INodeService_ISignMessage;
  waitBlockHeight: INodeService_IWaitBlockHeight;
  wait: INodeService_IWait;
  stop: INodeService_IStop;
  preApproveKeysend: INodeService_IPreApproveKeysend;
  preApproveInvoice: INodeService_IPreApproveInvoice;
  staticBackup: INodeService_IStaticBackup;
}

interface INodeService_IGetinfo
  extends grpc.MethodDefinition<
    cln_node_pb.GetinfoRequest,
    cln_node_pb.GetinfoResponse
  > {
  path: '/cln.Node/Getinfo';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.GetinfoRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.GetinfoRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.GetinfoResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.GetinfoResponse>;
}
interface INodeService_IListPeers
  extends grpc.MethodDefinition<
    cln_node_pb.ListpeersRequest,
    cln_node_pb.ListpeersResponse
  > {
  path: '/cln.Node/ListPeers';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListpeersRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListpeersRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListpeersResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListpeersResponse>;
}
interface INodeService_IListFunds
  extends grpc.MethodDefinition<
    cln_node_pb.ListfundsRequest,
    cln_node_pb.ListfundsResponse
  > {
  path: '/cln.Node/ListFunds';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListfundsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListfundsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListfundsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListfundsResponse>;
}
interface INodeService_ISendPay
  extends grpc.MethodDefinition<
    cln_node_pb.SendpayRequest,
    cln_node_pb.SendpayResponse
  > {
  path: '/cln.Node/SendPay';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SendpayRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SendpayRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SendpayResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SendpayResponse>;
}
interface INodeService_IListChannels
  extends grpc.MethodDefinition<
    cln_node_pb.ListchannelsRequest,
    cln_node_pb.ListchannelsResponse
  > {
  path: '/cln.Node/ListChannels';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListchannelsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListchannelsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListchannelsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListchannelsResponse>;
}
interface INodeService_IAddGossip
  extends grpc.MethodDefinition<
    cln_node_pb.AddgossipRequest,
    cln_node_pb.AddgossipResponse
  > {
  path: '/cln.Node/AddGossip';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.AddgossipRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.AddgossipRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.AddgossipResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.AddgossipResponse>;
}
interface INodeService_IAutoCleanInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.AutocleaninvoiceRequest,
    cln_node_pb.AutocleaninvoiceResponse
  > {
  path: '/cln.Node/AutoCleanInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.AutocleaninvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.AutocleaninvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.AutocleaninvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.AutocleaninvoiceResponse>;
}
interface INodeService_ICheckMessage
  extends grpc.MethodDefinition<
    cln_node_pb.CheckmessageRequest,
    cln_node_pb.CheckmessageResponse
  > {
  path: '/cln.Node/CheckMessage';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.CheckmessageRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.CheckmessageRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.CheckmessageResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.CheckmessageResponse>;
}
interface INodeService_IClose
  extends grpc.MethodDefinition<
    cln_node_pb.CloseRequest,
    cln_node_pb.CloseResponse
  > {
  path: '/cln.Node/Close';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.CloseRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.CloseRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.CloseResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.CloseResponse>;
}
interface INodeService_IConnectPeer
  extends grpc.MethodDefinition<
    cln_node_pb.ConnectRequest,
    cln_node_pb.ConnectResponse
  > {
  path: '/cln.Node/ConnectPeer';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ConnectRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ConnectRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ConnectResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ConnectResponse>;
}
interface INodeService_ICreateInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.CreateinvoiceRequest,
    cln_node_pb.CreateinvoiceResponse
  > {
  path: '/cln.Node/CreateInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.CreateinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.CreateinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.CreateinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.CreateinvoiceResponse>;
}
interface INodeService_IDatastore
  extends grpc.MethodDefinition<
    cln_node_pb.DatastoreRequest,
    cln_node_pb.DatastoreResponse
  > {
  path: '/cln.Node/Datastore';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DatastoreRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DatastoreRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DatastoreResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DatastoreResponse>;
}
interface INodeService_IDatastoreUsage
  extends grpc.MethodDefinition<
    cln_node_pb.DatastoreusageRequest,
    cln_node_pb.DatastoreusageResponse
  > {
  path: '/cln.Node/DatastoreUsage';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DatastoreusageRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DatastoreusageRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DatastoreusageResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DatastoreusageResponse>;
}
interface INodeService_ICreateOnion
  extends grpc.MethodDefinition<
    cln_node_pb.CreateonionRequest,
    cln_node_pb.CreateonionResponse
  > {
  path: '/cln.Node/CreateOnion';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.CreateonionRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.CreateonionRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.CreateonionResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.CreateonionResponse>;
}
interface INodeService_IDelDatastore
  extends grpc.MethodDefinition<
    cln_node_pb.DeldatastoreRequest,
    cln_node_pb.DeldatastoreResponse
  > {
  path: '/cln.Node/DelDatastore';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DeldatastoreRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DeldatastoreRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DeldatastoreResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DeldatastoreResponse>;
}
interface INodeService_IDelExpiredInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.DelexpiredinvoiceRequest,
    cln_node_pb.DelexpiredinvoiceResponse
  > {
  path: '/cln.Node/DelExpiredInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DelexpiredinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DelexpiredinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DelexpiredinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DelexpiredinvoiceResponse>;
}
interface INodeService_IDelInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.DelinvoiceRequest,
    cln_node_pb.DelinvoiceResponse
  > {
  path: '/cln.Node/DelInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DelinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DelinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DelinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DelinvoiceResponse>;
}
interface INodeService_IInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.InvoiceRequest,
    cln_node_pb.InvoiceResponse
  > {
  path: '/cln.Node/Invoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.InvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.InvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.InvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.InvoiceResponse>;
}
interface INodeService_IListDatastore
  extends grpc.MethodDefinition<
    cln_node_pb.ListdatastoreRequest,
    cln_node_pb.ListdatastoreResponse
  > {
  path: '/cln.Node/ListDatastore';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListdatastoreRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListdatastoreRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListdatastoreResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListdatastoreResponse>;
}
interface INodeService_IListInvoices
  extends grpc.MethodDefinition<
    cln_node_pb.ListinvoicesRequest,
    cln_node_pb.ListinvoicesResponse
  > {
  path: '/cln.Node/ListInvoices';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListinvoicesRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListinvoicesRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListinvoicesResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListinvoicesResponse>;
}
interface INodeService_ISendOnion
  extends grpc.MethodDefinition<
    cln_node_pb.SendonionRequest,
    cln_node_pb.SendonionResponse
  > {
  path: '/cln.Node/SendOnion';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SendonionRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SendonionRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SendonionResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SendonionResponse>;
}
interface INodeService_IListSendPays
  extends grpc.MethodDefinition<
    cln_node_pb.ListsendpaysRequest,
    cln_node_pb.ListsendpaysResponse
  > {
  path: '/cln.Node/ListSendPays';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListsendpaysRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListsendpaysRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListsendpaysResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListsendpaysResponse>;
}
interface INodeService_IListTransactions
  extends grpc.MethodDefinition<
    cln_node_pb.ListtransactionsRequest,
    cln_node_pb.ListtransactionsResponse
  > {
  path: '/cln.Node/ListTransactions';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListtransactionsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListtransactionsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListtransactionsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListtransactionsResponse>;
}
interface INodeService_IPay
  extends grpc.MethodDefinition<
    cln_node_pb.PayRequest,
    cln_node_pb.PayResponse
  > {
  path: '/cln.Node/Pay';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.PayRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.PayRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.PayResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.PayResponse>;
}
interface INodeService_IListNodes
  extends grpc.MethodDefinition<
    cln_node_pb.ListnodesRequest,
    cln_node_pb.ListnodesResponse
  > {
  path: '/cln.Node/ListNodes';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListnodesRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListnodesRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListnodesResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListnodesResponse>;
}
interface INodeService_IWaitAnyInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.WaitanyinvoiceRequest,
    cln_node_pb.WaitanyinvoiceResponse
  > {
  path: '/cln.Node/WaitAnyInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.WaitanyinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.WaitanyinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.WaitanyinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.WaitanyinvoiceResponse>;
}
interface INodeService_IWaitInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.WaitinvoiceRequest,
    cln_node_pb.WaitinvoiceResponse
  > {
  path: '/cln.Node/WaitInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.WaitinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.WaitinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.WaitinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.WaitinvoiceResponse>;
}
interface INodeService_IWaitSendPay
  extends grpc.MethodDefinition<
    cln_node_pb.WaitsendpayRequest,
    cln_node_pb.WaitsendpayResponse
  > {
  path: '/cln.Node/WaitSendPay';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.WaitsendpayRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.WaitsendpayRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.WaitsendpayResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.WaitsendpayResponse>;
}
interface INodeService_INewAddr
  extends grpc.MethodDefinition<
    cln_node_pb.NewaddrRequest,
    cln_node_pb.NewaddrResponse
  > {
  path: '/cln.Node/NewAddr';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.NewaddrRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.NewaddrRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.NewaddrResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.NewaddrResponse>;
}
interface INodeService_IWithdraw
  extends grpc.MethodDefinition<
    cln_node_pb.WithdrawRequest,
    cln_node_pb.WithdrawResponse
  > {
  path: '/cln.Node/Withdraw';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.WithdrawRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.WithdrawRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.WithdrawResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.WithdrawResponse>;
}
interface INodeService_IKeySend
  extends grpc.MethodDefinition<
    cln_node_pb.KeysendRequest,
    cln_node_pb.KeysendResponse
  > {
  path: '/cln.Node/KeySend';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.KeysendRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.KeysendRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.KeysendResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.KeysendResponse>;
}
interface INodeService_IFundPsbt
  extends grpc.MethodDefinition<
    cln_node_pb.FundpsbtRequest,
    cln_node_pb.FundpsbtResponse
  > {
  path: '/cln.Node/FundPsbt';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.FundpsbtRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.FundpsbtRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.FundpsbtResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.FundpsbtResponse>;
}
interface INodeService_ISendPsbt
  extends grpc.MethodDefinition<
    cln_node_pb.SendpsbtRequest,
    cln_node_pb.SendpsbtResponse
  > {
  path: '/cln.Node/SendPsbt';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SendpsbtRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SendpsbtRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SendpsbtResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SendpsbtResponse>;
}
interface INodeService_ISignPsbt
  extends grpc.MethodDefinition<
    cln_node_pb.SignpsbtRequest,
    cln_node_pb.SignpsbtResponse
  > {
  path: '/cln.Node/SignPsbt';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SignpsbtRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SignpsbtRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SignpsbtResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SignpsbtResponse>;
}
interface INodeService_IUtxoPsbt
  extends grpc.MethodDefinition<
    cln_node_pb.UtxopsbtRequest,
    cln_node_pb.UtxopsbtResponse
  > {
  path: '/cln.Node/UtxoPsbt';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.UtxopsbtRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.UtxopsbtRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.UtxopsbtResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.UtxopsbtResponse>;
}
interface INodeService_ITxDiscard
  extends grpc.MethodDefinition<
    cln_node_pb.TxdiscardRequest,
    cln_node_pb.TxdiscardResponse
  > {
  path: '/cln.Node/TxDiscard';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.TxdiscardRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.TxdiscardRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.TxdiscardResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.TxdiscardResponse>;
}
interface INodeService_ITxPrepare
  extends grpc.MethodDefinition<
    cln_node_pb.TxprepareRequest,
    cln_node_pb.TxprepareResponse
  > {
  path: '/cln.Node/TxPrepare';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.TxprepareRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.TxprepareRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.TxprepareResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.TxprepareResponse>;
}
interface INodeService_ITxSend
  extends grpc.MethodDefinition<
    cln_node_pb.TxsendRequest,
    cln_node_pb.TxsendResponse
  > {
  path: '/cln.Node/TxSend';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.TxsendRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.TxsendRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.TxsendResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.TxsendResponse>;
}
interface INodeService_IListPeerChannels
  extends grpc.MethodDefinition<
    cln_node_pb.ListpeerchannelsRequest,
    cln_node_pb.ListpeerchannelsResponse
  > {
  path: '/cln.Node/ListPeerChannels';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListpeerchannelsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListpeerchannelsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListpeerchannelsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListpeerchannelsResponse>;
}
interface INodeService_IListClosedChannels
  extends grpc.MethodDefinition<
    cln_node_pb.ListclosedchannelsRequest,
    cln_node_pb.ListclosedchannelsResponse
  > {
  path: '/cln.Node/ListClosedChannels';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListclosedchannelsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListclosedchannelsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListclosedchannelsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListclosedchannelsResponse>;
}
interface INodeService_IDecodePay
  extends grpc.MethodDefinition<
    cln_node_pb.DecodepayRequest,
    cln_node_pb.DecodepayResponse
  > {
  path: '/cln.Node/DecodePay';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DecodepayRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DecodepayRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DecodepayResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DecodepayResponse>;
}
interface INodeService_IDecode
  extends grpc.MethodDefinition<
    cln_node_pb.DecodeRequest,
    cln_node_pb.DecodeResponse
  > {
  path: '/cln.Node/Decode';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DecodeRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DecodeRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DecodeResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DecodeResponse>;
}
interface INodeService_IDisconnect
  extends grpc.MethodDefinition<
    cln_node_pb.DisconnectRequest,
    cln_node_pb.DisconnectResponse
  > {
  path: '/cln.Node/Disconnect';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.DisconnectRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.DisconnectRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.DisconnectResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.DisconnectResponse>;
}
interface INodeService_IFeerates
  extends grpc.MethodDefinition<
    cln_node_pb.FeeratesRequest,
    cln_node_pb.FeeratesResponse
  > {
  path: '/cln.Node/Feerates';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.FeeratesRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.FeeratesRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.FeeratesResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.FeeratesResponse>;
}
interface INodeService_IFetchInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.FetchinvoiceRequest,
    cln_node_pb.FetchinvoiceResponse
  > {
  path: '/cln.Node/FetchInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.FetchinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.FetchinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.FetchinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.FetchinvoiceResponse>;
}
interface INodeService_IFundChannel
  extends grpc.MethodDefinition<
    cln_node_pb.FundchannelRequest,
    cln_node_pb.FundchannelResponse
  > {
  path: '/cln.Node/FundChannel';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.FundchannelRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.FundchannelRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.FundchannelResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.FundchannelResponse>;
}
interface INodeService_IGetRoute
  extends grpc.MethodDefinition<
    cln_node_pb.GetrouteRequest,
    cln_node_pb.GetrouteResponse
  > {
  path: '/cln.Node/GetRoute';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.GetrouteRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.GetrouteRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.GetrouteResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.GetrouteResponse>;
}
interface INodeService_IListForwards
  extends grpc.MethodDefinition<
    cln_node_pb.ListforwardsRequest,
    cln_node_pb.ListforwardsResponse
  > {
  path: '/cln.Node/ListForwards';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListforwardsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListforwardsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListforwardsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListforwardsResponse>;
}
interface INodeService_IListPays
  extends grpc.MethodDefinition<
    cln_node_pb.ListpaysRequest,
    cln_node_pb.ListpaysResponse
  > {
  path: '/cln.Node/ListPays';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListpaysRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListpaysRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListpaysResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListpaysResponse>;
}
interface INodeService_IListHtlcs
  extends grpc.MethodDefinition<
    cln_node_pb.ListhtlcsRequest,
    cln_node_pb.ListhtlcsResponse
  > {
  path: '/cln.Node/ListHtlcs';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.ListhtlcsRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.ListhtlcsRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.ListhtlcsResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.ListhtlcsResponse>;
}
interface INodeService_IPing
  extends grpc.MethodDefinition<
    cln_node_pb.PingRequest,
    cln_node_pb.PingResponse
  > {
  path: '/cln.Node/Ping';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.PingRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.PingRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.PingResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.PingResponse>;
}
interface INodeService_ISendCustomMsg
  extends grpc.MethodDefinition<
    cln_node_pb.SendcustommsgRequest,
    cln_node_pb.SendcustommsgResponse
  > {
  path: '/cln.Node/SendCustomMsg';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SendcustommsgRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SendcustommsgRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SendcustommsgResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SendcustommsgResponse>;
}
interface INodeService_ISetChannel
  extends grpc.MethodDefinition<
    cln_node_pb.SetchannelRequest,
    cln_node_pb.SetchannelResponse
  > {
  path: '/cln.Node/SetChannel';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SetchannelRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SetchannelRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SetchannelResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SetchannelResponse>;
}
interface INodeService_ISignInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.SigninvoiceRequest,
    cln_node_pb.SigninvoiceResponse
  > {
  path: '/cln.Node/SignInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SigninvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SigninvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SigninvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SigninvoiceResponse>;
}
interface INodeService_ISignMessage
  extends grpc.MethodDefinition<
    cln_node_pb.SignmessageRequest,
    cln_node_pb.SignmessageResponse
  > {
  path: '/cln.Node/SignMessage';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.SignmessageRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.SignmessageRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.SignmessageResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.SignmessageResponse>;
}
interface INodeService_IWaitBlockHeight
  extends grpc.MethodDefinition<
    cln_node_pb.WaitblockheightRequest,
    cln_node_pb.WaitblockheightResponse
  > {
  path: '/cln.Node/WaitBlockHeight';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.WaitblockheightRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.WaitblockheightRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.WaitblockheightResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.WaitblockheightResponse>;
}
interface INodeService_IWait
  extends grpc.MethodDefinition<
    cln_node_pb.WaitRequest,
    cln_node_pb.WaitResponse
  > {
  path: '/cln.Node/Wait';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.WaitRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.WaitRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.WaitResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.WaitResponse>;
}
interface INodeService_IStop
  extends grpc.MethodDefinition<
    cln_node_pb.StopRequest,
    cln_node_pb.StopResponse
  > {
  path: '/cln.Node/Stop';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.StopRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.StopRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.StopResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.StopResponse>;
}
interface INodeService_IPreApproveKeysend
  extends grpc.MethodDefinition<
    cln_node_pb.PreapprovekeysendRequest,
    cln_node_pb.PreapprovekeysendResponse
  > {
  path: '/cln.Node/PreApproveKeysend';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.PreapprovekeysendRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.PreapprovekeysendRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.PreapprovekeysendResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.PreapprovekeysendResponse>;
}
interface INodeService_IPreApproveInvoice
  extends grpc.MethodDefinition<
    cln_node_pb.PreapproveinvoiceRequest,
    cln_node_pb.PreapproveinvoiceResponse
  > {
  path: '/cln.Node/PreApproveInvoice';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.PreapproveinvoiceRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.PreapproveinvoiceRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.PreapproveinvoiceResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.PreapproveinvoiceResponse>;
}
interface INodeService_IStaticBackup
  extends grpc.MethodDefinition<
    cln_node_pb.StaticbackupRequest,
    cln_node_pb.StaticbackupResponse
  > {
  path: '/cln.Node/StaticBackup';
  requestStream: false;
  responseStream: false;
  requestSerialize: grpc.serialize<cln_node_pb.StaticbackupRequest>;
  requestDeserialize: grpc.deserialize<cln_node_pb.StaticbackupRequest>;
  responseSerialize: grpc.serialize<cln_node_pb.StaticbackupResponse>;
  responseDeserialize: grpc.deserialize<cln_node_pb.StaticbackupResponse>;
}

export const NodeService: INodeService;

export interface INodeServer extends grpc.UntypedServiceImplementation {
  getinfo: grpc.handleUnaryCall<
    cln_node_pb.GetinfoRequest,
    cln_node_pb.GetinfoResponse
  >;
  listPeers: grpc.handleUnaryCall<
    cln_node_pb.ListpeersRequest,
    cln_node_pb.ListpeersResponse
  >;
  listFunds: grpc.handleUnaryCall<
    cln_node_pb.ListfundsRequest,
    cln_node_pb.ListfundsResponse
  >;
  sendPay: grpc.handleUnaryCall<
    cln_node_pb.SendpayRequest,
    cln_node_pb.SendpayResponse
  >;
  listChannels: grpc.handleUnaryCall<
    cln_node_pb.ListchannelsRequest,
    cln_node_pb.ListchannelsResponse
  >;
  addGossip: grpc.handleUnaryCall<
    cln_node_pb.AddgossipRequest,
    cln_node_pb.AddgossipResponse
  >;
  autoCleanInvoice: grpc.handleUnaryCall<
    cln_node_pb.AutocleaninvoiceRequest,
    cln_node_pb.AutocleaninvoiceResponse
  >;
  checkMessage: grpc.handleUnaryCall<
    cln_node_pb.CheckmessageRequest,
    cln_node_pb.CheckmessageResponse
  >;
  close: grpc.handleUnaryCall<
    cln_node_pb.CloseRequest,
    cln_node_pb.CloseResponse
  >;
  connectPeer: grpc.handleUnaryCall<
    cln_node_pb.ConnectRequest,
    cln_node_pb.ConnectResponse
  >;
  createInvoice: grpc.handleUnaryCall<
    cln_node_pb.CreateinvoiceRequest,
    cln_node_pb.CreateinvoiceResponse
  >;
  datastore: grpc.handleUnaryCall<
    cln_node_pb.DatastoreRequest,
    cln_node_pb.DatastoreResponse
  >;
  datastoreUsage: grpc.handleUnaryCall<
    cln_node_pb.DatastoreusageRequest,
    cln_node_pb.DatastoreusageResponse
  >;
  createOnion: grpc.handleUnaryCall<
    cln_node_pb.CreateonionRequest,
    cln_node_pb.CreateonionResponse
  >;
  delDatastore: grpc.handleUnaryCall<
    cln_node_pb.DeldatastoreRequest,
    cln_node_pb.DeldatastoreResponse
  >;
  delExpiredInvoice: grpc.handleUnaryCall<
    cln_node_pb.DelexpiredinvoiceRequest,
    cln_node_pb.DelexpiredinvoiceResponse
  >;
  delInvoice: grpc.handleUnaryCall<
    cln_node_pb.DelinvoiceRequest,
    cln_node_pb.DelinvoiceResponse
  >;
  invoice: grpc.handleUnaryCall<
    cln_node_pb.InvoiceRequest,
    cln_node_pb.InvoiceResponse
  >;
  listDatastore: grpc.handleUnaryCall<
    cln_node_pb.ListdatastoreRequest,
    cln_node_pb.ListdatastoreResponse
  >;
  listInvoices: grpc.handleUnaryCall<
    cln_node_pb.ListinvoicesRequest,
    cln_node_pb.ListinvoicesResponse
  >;
  sendOnion: grpc.handleUnaryCall<
    cln_node_pb.SendonionRequest,
    cln_node_pb.SendonionResponse
  >;
  listSendPays: grpc.handleUnaryCall<
    cln_node_pb.ListsendpaysRequest,
    cln_node_pb.ListsendpaysResponse
  >;
  listTransactions: grpc.handleUnaryCall<
    cln_node_pb.ListtransactionsRequest,
    cln_node_pb.ListtransactionsResponse
  >;
  pay: grpc.handleUnaryCall<cln_node_pb.PayRequest, cln_node_pb.PayResponse>;
  listNodes: grpc.handleUnaryCall<
    cln_node_pb.ListnodesRequest,
    cln_node_pb.ListnodesResponse
  >;
  waitAnyInvoice: grpc.handleUnaryCall<
    cln_node_pb.WaitanyinvoiceRequest,
    cln_node_pb.WaitanyinvoiceResponse
  >;
  waitInvoice: grpc.handleUnaryCall<
    cln_node_pb.WaitinvoiceRequest,
    cln_node_pb.WaitinvoiceResponse
  >;
  waitSendPay: grpc.handleUnaryCall<
    cln_node_pb.WaitsendpayRequest,
    cln_node_pb.WaitsendpayResponse
  >;
  newAddr: grpc.handleUnaryCall<
    cln_node_pb.NewaddrRequest,
    cln_node_pb.NewaddrResponse
  >;
  withdraw: grpc.handleUnaryCall<
    cln_node_pb.WithdrawRequest,
    cln_node_pb.WithdrawResponse
  >;
  keySend: grpc.handleUnaryCall<
    cln_node_pb.KeysendRequest,
    cln_node_pb.KeysendResponse
  >;
  fundPsbt: grpc.handleUnaryCall<
    cln_node_pb.FundpsbtRequest,
    cln_node_pb.FundpsbtResponse
  >;
  sendPsbt: grpc.handleUnaryCall<
    cln_node_pb.SendpsbtRequest,
    cln_node_pb.SendpsbtResponse
  >;
  signPsbt: grpc.handleUnaryCall<
    cln_node_pb.SignpsbtRequest,
    cln_node_pb.SignpsbtResponse
  >;
  utxoPsbt: grpc.handleUnaryCall<
    cln_node_pb.UtxopsbtRequest,
    cln_node_pb.UtxopsbtResponse
  >;
  txDiscard: grpc.handleUnaryCall<
    cln_node_pb.TxdiscardRequest,
    cln_node_pb.TxdiscardResponse
  >;
  txPrepare: grpc.handleUnaryCall<
    cln_node_pb.TxprepareRequest,
    cln_node_pb.TxprepareResponse
  >;
  txSend: grpc.handleUnaryCall<
    cln_node_pb.TxsendRequest,
    cln_node_pb.TxsendResponse
  >;
  listPeerChannels: grpc.handleUnaryCall<
    cln_node_pb.ListpeerchannelsRequest,
    cln_node_pb.ListpeerchannelsResponse
  >;
  listClosedChannels: grpc.handleUnaryCall<
    cln_node_pb.ListclosedchannelsRequest,
    cln_node_pb.ListclosedchannelsResponse
  >;
  decodePay: grpc.handleUnaryCall<
    cln_node_pb.DecodepayRequest,
    cln_node_pb.DecodepayResponse
  >;
  decode: grpc.handleUnaryCall<
    cln_node_pb.DecodeRequest,
    cln_node_pb.DecodeResponse
  >;
  disconnect: grpc.handleUnaryCall<
    cln_node_pb.DisconnectRequest,
    cln_node_pb.DisconnectResponse
  >;
  feerates: grpc.handleUnaryCall<
    cln_node_pb.FeeratesRequest,
    cln_node_pb.FeeratesResponse
  >;
  fetchInvoice: grpc.handleUnaryCall<
    cln_node_pb.FetchinvoiceRequest,
    cln_node_pb.FetchinvoiceResponse
  >;
  fundChannel: grpc.handleUnaryCall<
    cln_node_pb.FundchannelRequest,
    cln_node_pb.FundchannelResponse
  >;
  getRoute: grpc.handleUnaryCall<
    cln_node_pb.GetrouteRequest,
    cln_node_pb.GetrouteResponse
  >;
  listForwards: grpc.handleUnaryCall<
    cln_node_pb.ListforwardsRequest,
    cln_node_pb.ListforwardsResponse
  >;
  listPays: grpc.handleUnaryCall<
    cln_node_pb.ListpaysRequest,
    cln_node_pb.ListpaysResponse
  >;
  listHtlcs: grpc.handleUnaryCall<
    cln_node_pb.ListhtlcsRequest,
    cln_node_pb.ListhtlcsResponse
  >;
  ping: grpc.handleUnaryCall<cln_node_pb.PingRequest, cln_node_pb.PingResponse>;
  sendCustomMsg: grpc.handleUnaryCall<
    cln_node_pb.SendcustommsgRequest,
    cln_node_pb.SendcustommsgResponse
  >;
  setChannel: grpc.handleUnaryCall<
    cln_node_pb.SetchannelRequest,
    cln_node_pb.SetchannelResponse
  >;
  signInvoice: grpc.handleUnaryCall<
    cln_node_pb.SigninvoiceRequest,
    cln_node_pb.SigninvoiceResponse
  >;
  signMessage: grpc.handleUnaryCall<
    cln_node_pb.SignmessageRequest,
    cln_node_pb.SignmessageResponse
  >;
  waitBlockHeight: grpc.handleUnaryCall<
    cln_node_pb.WaitblockheightRequest,
    cln_node_pb.WaitblockheightResponse
  >;
  wait: grpc.handleUnaryCall<cln_node_pb.WaitRequest, cln_node_pb.WaitResponse>;
  stop: grpc.handleUnaryCall<cln_node_pb.StopRequest, cln_node_pb.StopResponse>;
  preApproveKeysend: grpc.handleUnaryCall<
    cln_node_pb.PreapprovekeysendRequest,
    cln_node_pb.PreapprovekeysendResponse
  >;
  preApproveInvoice: grpc.handleUnaryCall<
    cln_node_pb.PreapproveinvoiceRequest,
    cln_node_pb.PreapproveinvoiceResponse
  >;
  staticBackup: grpc.handleUnaryCall<
    cln_node_pb.StaticbackupRequest,
    cln_node_pb.StaticbackupResponse
  >;
}

export interface INodeClient {
  getinfo(
    request: cln_node_pb.GetinfoRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetinfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getinfo(
    request: cln_node_pb.GetinfoRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetinfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getinfo(
    request: cln_node_pb.GetinfoRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetinfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPeers(
    request: cln_node_pb.ListpeersRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeersResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPeers(
    request: cln_node_pb.ListpeersRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeersResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPeers(
    request: cln_node_pb.ListpeersRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeersResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listFunds(
    request: cln_node_pb.ListfundsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListfundsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listFunds(
    request: cln_node_pb.ListfundsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListfundsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listFunds(
    request: cln_node_pb.ListfundsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListfundsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendPay(
    request: cln_node_pb.SendpayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendPay(
    request: cln_node_pb.SendpayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendPay(
    request: cln_node_pb.SendpayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listChannels(
    request: cln_node_pb.ListchannelsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listChannels(
    request: cln_node_pb.ListchannelsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listChannels(
    request: cln_node_pb.ListchannelsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  addGossip(
    request: cln_node_pb.AddgossipRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AddgossipResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  addGossip(
    request: cln_node_pb.AddgossipRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AddgossipResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  addGossip(
    request: cln_node_pb.AddgossipRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AddgossipResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  autoCleanInvoice(
    request: cln_node_pb.AutocleaninvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AutocleaninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  autoCleanInvoice(
    request: cln_node_pb.AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AutocleaninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  autoCleanInvoice(
    request: cln_node_pb.AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AutocleaninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  checkMessage(
    request: cln_node_pb.CheckmessageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CheckmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  checkMessage(
    request: cln_node_pb.CheckmessageRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CheckmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  checkMessage(
    request: cln_node_pb.CheckmessageRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CheckmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  close(
    request: cln_node_pb.CloseRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CloseResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  close(
    request: cln_node_pb.CloseRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CloseResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  close(
    request: cln_node_pb.CloseRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CloseResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  connectPeer(
    request: cln_node_pb.ConnectRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ConnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  connectPeer(
    request: cln_node_pb.ConnectRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ConnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  connectPeer(
    request: cln_node_pb.ConnectRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ConnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  createInvoice(
    request: cln_node_pb.CreateinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  createInvoice(
    request: cln_node_pb.CreateinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  createInvoice(
    request: cln_node_pb.CreateinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  datastore(
    request: cln_node_pb.DatastoreRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  datastore(
    request: cln_node_pb.DatastoreRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  datastore(
    request: cln_node_pb.DatastoreRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  datastoreUsage(
    request: cln_node_pb.DatastoreusageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreusageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  datastoreUsage(
    request: cln_node_pb.DatastoreusageRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreusageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  datastoreUsage(
    request: cln_node_pb.DatastoreusageRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreusageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  createOnion(
    request: cln_node_pb.CreateonionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  createOnion(
    request: cln_node_pb.CreateonionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  createOnion(
    request: cln_node_pb.CreateonionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delDatastore(
    request: cln_node_pb.DeldatastoreRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DeldatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delDatastore(
    request: cln_node_pb.DeldatastoreRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DeldatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delDatastore(
    request: cln_node_pb.DeldatastoreRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DeldatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delExpiredInvoice(
    request: cln_node_pb.DelexpiredinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelexpiredinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delExpiredInvoice(
    request: cln_node_pb.DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelexpiredinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delExpiredInvoice(
    request: cln_node_pb.DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelexpiredinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delInvoice(
    request: cln_node_pb.DelinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delInvoice(
    request: cln_node_pb.DelinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  delInvoice(
    request: cln_node_pb.DelinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  invoice(
    request: cln_node_pb.InvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  invoice(
    request: cln_node_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  invoice(
    request: cln_node_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listDatastore(
    request: cln_node_pb.ListdatastoreRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListdatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listDatastore(
    request: cln_node_pb.ListdatastoreRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListdatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listDatastore(
    request: cln_node_pb.ListdatastoreRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListdatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listInvoices(
    request: cln_node_pb.ListinvoicesRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListinvoicesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listInvoices(
    request: cln_node_pb.ListinvoicesRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListinvoicesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listInvoices(
    request: cln_node_pb.ListinvoicesRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListinvoicesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendOnion(
    request: cln_node_pb.SendonionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendOnion(
    request: cln_node_pb.SendonionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendOnion(
    request: cln_node_pb.SendonionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listSendPays(
    request: cln_node_pb.ListsendpaysRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListsendpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listSendPays(
    request: cln_node_pb.ListsendpaysRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListsendpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listSendPays(
    request: cln_node_pb.ListsendpaysRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListsendpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listTransactions(
    request: cln_node_pb.ListtransactionsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListtransactionsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listTransactions(
    request: cln_node_pb.ListtransactionsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListtransactionsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listTransactions(
    request: cln_node_pb.ListtransactionsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListtransactionsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  pay(
    request: cln_node_pb.PayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  pay(
    request: cln_node_pb.PayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  pay(
    request: cln_node_pb.PayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listNodes(
    request: cln_node_pb.ListnodesRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListnodesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listNodes(
    request: cln_node_pb.ListnodesRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListnodesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listNodes(
    request: cln_node_pb.ListnodesRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListnodesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitAnyInvoice(
    request: cln_node_pb.WaitanyinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitanyinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitAnyInvoice(
    request: cln_node_pb.WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitanyinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitAnyInvoice(
    request: cln_node_pb.WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitanyinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitInvoice(
    request: cln_node_pb.WaitinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitInvoice(
    request: cln_node_pb.WaitinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitInvoice(
    request: cln_node_pb.WaitinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitSendPay(
    request: cln_node_pb.WaitsendpayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitsendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitSendPay(
    request: cln_node_pb.WaitsendpayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitsendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitSendPay(
    request: cln_node_pb.WaitsendpayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitsendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  newAddr(
    request: cln_node_pb.NewaddrRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.NewaddrResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  newAddr(
    request: cln_node_pb.NewaddrRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.NewaddrResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  newAddr(
    request: cln_node_pb.NewaddrRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.NewaddrResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  withdraw(
    request: cln_node_pb.WithdrawRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WithdrawResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  withdraw(
    request: cln_node_pb.WithdrawRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WithdrawResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  withdraw(
    request: cln_node_pb.WithdrawRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WithdrawResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  keySend(
    request: cln_node_pb.KeysendRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.KeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  keySend(
    request: cln_node_pb.KeysendRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.KeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  keySend(
    request: cln_node_pb.KeysendRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.KeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fundPsbt(
    request: cln_node_pb.FundpsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fundPsbt(
    request: cln_node_pb.FundpsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fundPsbt(
    request: cln_node_pb.FundpsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendPsbt(
    request: cln_node_pb.SendpsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendPsbt(
    request: cln_node_pb.SendpsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendPsbt(
    request: cln_node_pb.SendpsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signPsbt(
    request: cln_node_pb.SignpsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signPsbt(
    request: cln_node_pb.SignpsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signPsbt(
    request: cln_node_pb.SignpsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  utxoPsbt(
    request: cln_node_pb.UtxopsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.UtxopsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  utxoPsbt(
    request: cln_node_pb.UtxopsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.UtxopsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  utxoPsbt(
    request: cln_node_pb.UtxopsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.UtxopsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txDiscard(
    request: cln_node_pb.TxdiscardRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxdiscardResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txDiscard(
    request: cln_node_pb.TxdiscardRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxdiscardResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txDiscard(
    request: cln_node_pb.TxdiscardRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxdiscardResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txPrepare(
    request: cln_node_pb.TxprepareRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxprepareResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txPrepare(
    request: cln_node_pb.TxprepareRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxprepareResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txPrepare(
    request: cln_node_pb.TxprepareRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxprepareResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txSend(
    request: cln_node_pb.TxsendRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxsendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txSend(
    request: cln_node_pb.TxsendRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxsendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  txSend(
    request: cln_node_pb.TxsendRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxsendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPeerChannels(
    request: cln_node_pb.ListpeerchannelsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeerchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPeerChannels(
    request: cln_node_pb.ListpeerchannelsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeerchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPeerChannels(
    request: cln_node_pb.ListpeerchannelsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeerchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listClosedChannels(
    request: cln_node_pb.ListclosedchannelsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListclosedchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listClosedChannels(
    request: cln_node_pb.ListclosedchannelsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListclosedchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listClosedChannels(
    request: cln_node_pb.ListclosedchannelsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListclosedchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  decodePay(
    request: cln_node_pb.DecodepayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodepayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  decodePay(
    request: cln_node_pb.DecodepayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodepayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  decodePay(
    request: cln_node_pb.DecodepayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodepayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  decode(
    request: cln_node_pb.DecodeRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodeResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  decode(
    request: cln_node_pb.DecodeRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodeResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  decode(
    request: cln_node_pb.DecodeRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodeResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  disconnect(
    request: cln_node_pb.DisconnectRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DisconnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  disconnect(
    request: cln_node_pb.DisconnectRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DisconnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  disconnect(
    request: cln_node_pb.DisconnectRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DisconnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  feerates(
    request: cln_node_pb.FeeratesRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FeeratesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  feerates(
    request: cln_node_pb.FeeratesRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FeeratesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  feerates(
    request: cln_node_pb.FeeratesRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FeeratesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fetchInvoice(
    request: cln_node_pb.FetchinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FetchinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fetchInvoice(
    request: cln_node_pb.FetchinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FetchinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fetchInvoice(
    request: cln_node_pb.FetchinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FetchinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fundChannel(
    request: cln_node_pb.FundchannelRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fundChannel(
    request: cln_node_pb.FundchannelRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  fundChannel(
    request: cln_node_pb.FundchannelRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getRoute(
    request: cln_node_pb.GetrouteRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetrouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getRoute(
    request: cln_node_pb.GetrouteRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetrouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  getRoute(
    request: cln_node_pb.GetrouteRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetrouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listForwards(
    request: cln_node_pb.ListforwardsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListforwardsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listForwards(
    request: cln_node_pb.ListforwardsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListforwardsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listForwards(
    request: cln_node_pb.ListforwardsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListforwardsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPays(
    request: cln_node_pb.ListpaysRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPays(
    request: cln_node_pb.ListpaysRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listPays(
    request: cln_node_pb.ListpaysRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listHtlcs(
    request: cln_node_pb.ListhtlcsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListhtlcsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listHtlcs(
    request: cln_node_pb.ListhtlcsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListhtlcsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  listHtlcs(
    request: cln_node_pb.ListhtlcsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListhtlcsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  ping(
    request: cln_node_pb.PingRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PingResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  ping(
    request: cln_node_pb.PingRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PingResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  ping(
    request: cln_node_pb.PingRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PingResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendCustomMsg(
    request: cln_node_pb.SendcustommsgRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendcustommsgResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendCustomMsg(
    request: cln_node_pb.SendcustommsgRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendcustommsgResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  sendCustomMsg(
    request: cln_node_pb.SendcustommsgRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendcustommsgResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  setChannel(
    request: cln_node_pb.SetchannelRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SetchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  setChannel(
    request: cln_node_pb.SetchannelRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SetchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  setChannel(
    request: cln_node_pb.SetchannelRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SetchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signInvoice(
    request: cln_node_pb.SigninvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SigninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signInvoice(
    request: cln_node_pb.SigninvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SigninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signInvoice(
    request: cln_node_pb.SigninvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SigninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signMessage(
    request: cln_node_pb.SignmessageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signMessage(
    request: cln_node_pb.SignmessageRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  signMessage(
    request: cln_node_pb.SignmessageRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitBlockHeight(
    request: cln_node_pb.WaitblockheightRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitblockheightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitBlockHeight(
    request: cln_node_pb.WaitblockheightRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitblockheightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  waitBlockHeight(
    request: cln_node_pb.WaitblockheightRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitblockheightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  wait(
    request: cln_node_pb.WaitRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  wait(
    request: cln_node_pb.WaitRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  wait(
    request: cln_node_pb.WaitRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  stop(
    request: cln_node_pb.StopRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StopResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  stop(
    request: cln_node_pb.StopRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StopResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  stop(
    request: cln_node_pb.StopRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StopResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  preApproveKeysend(
    request: cln_node_pb.PreapprovekeysendRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapprovekeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  preApproveKeysend(
    request: cln_node_pb.PreapprovekeysendRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapprovekeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  preApproveKeysend(
    request: cln_node_pb.PreapprovekeysendRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapprovekeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  preApproveInvoice(
    request: cln_node_pb.PreapproveinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapproveinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  preApproveInvoice(
    request: cln_node_pb.PreapproveinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapproveinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  preApproveInvoice(
    request: cln_node_pb.PreapproveinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapproveinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  staticBackup(
    request: cln_node_pb.StaticbackupRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StaticbackupResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  staticBackup(
    request: cln_node_pb.StaticbackupRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StaticbackupResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  staticBackup(
    request: cln_node_pb.StaticbackupRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StaticbackupResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
}

export class NodeClient extends grpc.Client implements INodeClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ClientOptions>,
  );
  public getinfo(
    request: cln_node_pb.GetinfoRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetinfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getinfo(
    request: cln_node_pb.GetinfoRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetinfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getinfo(
    request: cln_node_pb.GetinfoRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetinfoResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPeers(
    request: cln_node_pb.ListpeersRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeersResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPeers(
    request: cln_node_pb.ListpeersRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeersResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPeers(
    request: cln_node_pb.ListpeersRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeersResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listFunds(
    request: cln_node_pb.ListfundsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListfundsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listFunds(
    request: cln_node_pb.ListfundsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListfundsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listFunds(
    request: cln_node_pb.ListfundsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListfundsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendPay(
    request: cln_node_pb.SendpayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendPay(
    request: cln_node_pb.SendpayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendPay(
    request: cln_node_pb.SendpayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listChannels(
    request: cln_node_pb.ListchannelsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listChannels(
    request: cln_node_pb.ListchannelsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listChannels(
    request: cln_node_pb.ListchannelsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public addGossip(
    request: cln_node_pb.AddgossipRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AddgossipResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public addGossip(
    request: cln_node_pb.AddgossipRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AddgossipResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public addGossip(
    request: cln_node_pb.AddgossipRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AddgossipResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public autoCleanInvoice(
    request: cln_node_pb.AutocleaninvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AutocleaninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public autoCleanInvoice(
    request: cln_node_pb.AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AutocleaninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public autoCleanInvoice(
    request: cln_node_pb.AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.AutocleaninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public checkMessage(
    request: cln_node_pb.CheckmessageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CheckmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public checkMessage(
    request: cln_node_pb.CheckmessageRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CheckmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public checkMessage(
    request: cln_node_pb.CheckmessageRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CheckmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public close(
    request: cln_node_pb.CloseRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CloseResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public close(
    request: cln_node_pb.CloseRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CloseResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public close(
    request: cln_node_pb.CloseRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CloseResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public connectPeer(
    request: cln_node_pb.ConnectRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ConnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public connectPeer(
    request: cln_node_pb.ConnectRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ConnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public connectPeer(
    request: cln_node_pb.ConnectRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ConnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public createInvoice(
    request: cln_node_pb.CreateinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public createInvoice(
    request: cln_node_pb.CreateinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public createInvoice(
    request: cln_node_pb.CreateinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public datastore(
    request: cln_node_pb.DatastoreRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public datastore(
    request: cln_node_pb.DatastoreRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public datastore(
    request: cln_node_pb.DatastoreRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public datastoreUsage(
    request: cln_node_pb.DatastoreusageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreusageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public datastoreUsage(
    request: cln_node_pb.DatastoreusageRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreusageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public datastoreUsage(
    request: cln_node_pb.DatastoreusageRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DatastoreusageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public createOnion(
    request: cln_node_pb.CreateonionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public createOnion(
    request: cln_node_pb.CreateonionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public createOnion(
    request: cln_node_pb.CreateonionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.CreateonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delDatastore(
    request: cln_node_pb.DeldatastoreRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DeldatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delDatastore(
    request: cln_node_pb.DeldatastoreRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DeldatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delDatastore(
    request: cln_node_pb.DeldatastoreRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DeldatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delExpiredInvoice(
    request: cln_node_pb.DelexpiredinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelexpiredinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delExpiredInvoice(
    request: cln_node_pb.DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelexpiredinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delExpiredInvoice(
    request: cln_node_pb.DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelexpiredinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delInvoice(
    request: cln_node_pb.DelinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delInvoice(
    request: cln_node_pb.DelinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public delInvoice(
    request: cln_node_pb.DelinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DelinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public invoice(
    request: cln_node_pb.InvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public invoice(
    request: cln_node_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public invoice(
    request: cln_node_pb.InvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.InvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listDatastore(
    request: cln_node_pb.ListdatastoreRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListdatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listDatastore(
    request: cln_node_pb.ListdatastoreRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListdatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listDatastore(
    request: cln_node_pb.ListdatastoreRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListdatastoreResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listInvoices(
    request: cln_node_pb.ListinvoicesRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListinvoicesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listInvoices(
    request: cln_node_pb.ListinvoicesRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListinvoicesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listInvoices(
    request: cln_node_pb.ListinvoicesRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListinvoicesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendOnion(
    request: cln_node_pb.SendonionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendOnion(
    request: cln_node_pb.SendonionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendOnion(
    request: cln_node_pb.SendonionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendonionResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listSendPays(
    request: cln_node_pb.ListsendpaysRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListsendpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listSendPays(
    request: cln_node_pb.ListsendpaysRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListsendpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listSendPays(
    request: cln_node_pb.ListsendpaysRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListsendpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listTransactions(
    request: cln_node_pb.ListtransactionsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListtransactionsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listTransactions(
    request: cln_node_pb.ListtransactionsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListtransactionsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listTransactions(
    request: cln_node_pb.ListtransactionsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListtransactionsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public pay(
    request: cln_node_pb.PayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public pay(
    request: cln_node_pb.PayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public pay(
    request: cln_node_pb.PayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listNodes(
    request: cln_node_pb.ListnodesRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListnodesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listNodes(
    request: cln_node_pb.ListnodesRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListnodesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listNodes(
    request: cln_node_pb.ListnodesRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListnodesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitAnyInvoice(
    request: cln_node_pb.WaitanyinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitanyinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitAnyInvoice(
    request: cln_node_pb.WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitanyinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitAnyInvoice(
    request: cln_node_pb.WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitanyinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitInvoice(
    request: cln_node_pb.WaitinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitInvoice(
    request: cln_node_pb.WaitinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitInvoice(
    request: cln_node_pb.WaitinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitSendPay(
    request: cln_node_pb.WaitsendpayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitsendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitSendPay(
    request: cln_node_pb.WaitsendpayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitsendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitSendPay(
    request: cln_node_pb.WaitsendpayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitsendpayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public newAddr(
    request: cln_node_pb.NewaddrRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.NewaddrResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public newAddr(
    request: cln_node_pb.NewaddrRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.NewaddrResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public newAddr(
    request: cln_node_pb.NewaddrRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.NewaddrResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public withdraw(
    request: cln_node_pb.WithdrawRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WithdrawResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public withdraw(
    request: cln_node_pb.WithdrawRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WithdrawResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public withdraw(
    request: cln_node_pb.WithdrawRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WithdrawResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public keySend(
    request: cln_node_pb.KeysendRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.KeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public keySend(
    request: cln_node_pb.KeysendRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.KeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public keySend(
    request: cln_node_pb.KeysendRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.KeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fundPsbt(
    request: cln_node_pb.FundpsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fundPsbt(
    request: cln_node_pb.FundpsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fundPsbt(
    request: cln_node_pb.FundpsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendPsbt(
    request: cln_node_pb.SendpsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendPsbt(
    request: cln_node_pb.SendpsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendPsbt(
    request: cln_node_pb.SendpsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signPsbt(
    request: cln_node_pb.SignpsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signPsbt(
    request: cln_node_pb.SignpsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signPsbt(
    request: cln_node_pb.SignpsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignpsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public utxoPsbt(
    request: cln_node_pb.UtxopsbtRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.UtxopsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public utxoPsbt(
    request: cln_node_pb.UtxopsbtRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.UtxopsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public utxoPsbt(
    request: cln_node_pb.UtxopsbtRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.UtxopsbtResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txDiscard(
    request: cln_node_pb.TxdiscardRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxdiscardResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txDiscard(
    request: cln_node_pb.TxdiscardRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxdiscardResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txDiscard(
    request: cln_node_pb.TxdiscardRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxdiscardResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txPrepare(
    request: cln_node_pb.TxprepareRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxprepareResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txPrepare(
    request: cln_node_pb.TxprepareRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxprepareResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txPrepare(
    request: cln_node_pb.TxprepareRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxprepareResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txSend(
    request: cln_node_pb.TxsendRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxsendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txSend(
    request: cln_node_pb.TxsendRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxsendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public txSend(
    request: cln_node_pb.TxsendRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.TxsendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPeerChannels(
    request: cln_node_pb.ListpeerchannelsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeerchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPeerChannels(
    request: cln_node_pb.ListpeerchannelsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeerchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPeerChannels(
    request: cln_node_pb.ListpeerchannelsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpeerchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listClosedChannels(
    request: cln_node_pb.ListclosedchannelsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListclosedchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listClosedChannels(
    request: cln_node_pb.ListclosedchannelsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListclosedchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listClosedChannels(
    request: cln_node_pb.ListclosedchannelsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListclosedchannelsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public decodePay(
    request: cln_node_pb.DecodepayRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodepayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public decodePay(
    request: cln_node_pb.DecodepayRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodepayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public decodePay(
    request: cln_node_pb.DecodepayRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodepayResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public decode(
    request: cln_node_pb.DecodeRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodeResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public decode(
    request: cln_node_pb.DecodeRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodeResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public decode(
    request: cln_node_pb.DecodeRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DecodeResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public disconnect(
    request: cln_node_pb.DisconnectRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DisconnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public disconnect(
    request: cln_node_pb.DisconnectRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DisconnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public disconnect(
    request: cln_node_pb.DisconnectRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.DisconnectResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public feerates(
    request: cln_node_pb.FeeratesRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FeeratesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public feerates(
    request: cln_node_pb.FeeratesRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FeeratesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public feerates(
    request: cln_node_pb.FeeratesRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FeeratesResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fetchInvoice(
    request: cln_node_pb.FetchinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FetchinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fetchInvoice(
    request: cln_node_pb.FetchinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FetchinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fetchInvoice(
    request: cln_node_pb.FetchinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FetchinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fundChannel(
    request: cln_node_pb.FundchannelRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fundChannel(
    request: cln_node_pb.FundchannelRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public fundChannel(
    request: cln_node_pb.FundchannelRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.FundchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getRoute(
    request: cln_node_pb.GetrouteRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetrouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getRoute(
    request: cln_node_pb.GetrouteRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetrouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public getRoute(
    request: cln_node_pb.GetrouteRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.GetrouteResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listForwards(
    request: cln_node_pb.ListforwardsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListforwardsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listForwards(
    request: cln_node_pb.ListforwardsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListforwardsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listForwards(
    request: cln_node_pb.ListforwardsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListforwardsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPays(
    request: cln_node_pb.ListpaysRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPays(
    request: cln_node_pb.ListpaysRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listPays(
    request: cln_node_pb.ListpaysRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListpaysResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listHtlcs(
    request: cln_node_pb.ListhtlcsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListhtlcsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listHtlcs(
    request: cln_node_pb.ListhtlcsRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListhtlcsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public listHtlcs(
    request: cln_node_pb.ListhtlcsRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.ListhtlcsResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public ping(
    request: cln_node_pb.PingRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PingResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public ping(
    request: cln_node_pb.PingRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PingResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public ping(
    request: cln_node_pb.PingRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PingResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendCustomMsg(
    request: cln_node_pb.SendcustommsgRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendcustommsgResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendCustomMsg(
    request: cln_node_pb.SendcustommsgRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendcustommsgResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public sendCustomMsg(
    request: cln_node_pb.SendcustommsgRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SendcustommsgResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public setChannel(
    request: cln_node_pb.SetchannelRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SetchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public setChannel(
    request: cln_node_pb.SetchannelRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SetchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public setChannel(
    request: cln_node_pb.SetchannelRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SetchannelResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signInvoice(
    request: cln_node_pb.SigninvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SigninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signInvoice(
    request: cln_node_pb.SigninvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SigninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signInvoice(
    request: cln_node_pb.SigninvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SigninvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signMessage(
    request: cln_node_pb.SignmessageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signMessage(
    request: cln_node_pb.SignmessageRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public signMessage(
    request: cln_node_pb.SignmessageRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.SignmessageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitBlockHeight(
    request: cln_node_pb.WaitblockheightRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitblockheightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitBlockHeight(
    request: cln_node_pb.WaitblockheightRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitblockheightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public waitBlockHeight(
    request: cln_node_pb.WaitblockheightRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitblockheightResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public wait(
    request: cln_node_pb.WaitRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public wait(
    request: cln_node_pb.WaitRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public wait(
    request: cln_node_pb.WaitRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.WaitResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public stop(
    request: cln_node_pb.StopRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StopResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public stop(
    request: cln_node_pb.StopRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StopResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public stop(
    request: cln_node_pb.StopRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StopResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public preApproveKeysend(
    request: cln_node_pb.PreapprovekeysendRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapprovekeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public preApproveKeysend(
    request: cln_node_pb.PreapprovekeysendRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapprovekeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public preApproveKeysend(
    request: cln_node_pb.PreapprovekeysendRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapprovekeysendResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public preApproveInvoice(
    request: cln_node_pb.PreapproveinvoiceRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapproveinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public preApproveInvoice(
    request: cln_node_pb.PreapproveinvoiceRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapproveinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public preApproveInvoice(
    request: cln_node_pb.PreapproveinvoiceRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.PreapproveinvoiceResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public staticBackup(
    request: cln_node_pb.StaticbackupRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StaticbackupResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public staticBackup(
    request: cln_node_pb.StaticbackupRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StaticbackupResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
  public staticBackup(
    request: cln_node_pb.StaticbackupRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: cln_node_pb.StaticbackupResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
}
