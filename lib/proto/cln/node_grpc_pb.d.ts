// package: cln
// file: cln/node.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as cln_node_pb from "../cln/node_pb";
import * as cln_primitives_pb from "../cln/primitives_pb";

interface INodeService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getinfo: INodeService_IGetinfo;
    listPeers: INodeService_IListPeers;
    listFunds: INodeService_IListFunds;
    sendPay: INodeService_ISendPay;
    listChannels: INodeService_IListChannels;
    addGossip: INodeService_IAddGossip;
    addPsbtOutput: INodeService_IAddPsbtOutput;
    autoCleanOnce: INodeService_IAutoCleanOnce;
    autoCleanStatus: INodeService_IAutoCleanStatus;
    checkMessage: INodeService_ICheckMessage;
    close: INodeService_IClose;
    connectPeer: INodeService_IConnectPeer;
    createInvoice: INodeService_ICreateInvoice;
    datastore: INodeService_IDatastore;
    datastoreUsage: INodeService_IDatastoreUsage;
    createOnion: INodeService_ICreateOnion;
    delDatastore: INodeService_IDelDatastore;
    delInvoice: INodeService_IDelInvoice;
    devForgetChannel: INodeService_IDevForgetChannel;
    emergencyRecover: INodeService_IEmergencyRecover;
    getEmergencyRecoverData: INodeService_IGetEmergencyRecoverData;
    exposeSecret: INodeService_IExposeSecret;
    recover: INodeService_IRecover;
    recoverChannel: INodeService_IRecoverChannel;
    invoice: INodeService_IInvoice;
    createInvoiceRequest: INodeService_ICreateInvoiceRequest;
    disableInvoiceRequest: INodeService_IDisableInvoiceRequest;
    listInvoiceRequests: INodeService_IListInvoiceRequests;
    listDatastore: INodeService_IListDatastore;
    listInvoices: INodeService_IListInvoices;
    sendOnion: INodeService_ISendOnion;
    listSendPays: INodeService_IListSendPays;
    listTransactions: INodeService_IListTransactions;
    makeSecret: INodeService_IMakeSecret;
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
    delPay: INodeService_IDelPay;
    delForward: INodeService_IDelForward;
    disableOffer: INodeService_IDisableOffer;
    enableOffer: INodeService_IEnableOffer;
    disconnect: INodeService_IDisconnect;
    feerates: INodeService_IFeerates;
    fetchInvoice: INodeService_IFetchInvoice;
    fundChannel_Cancel: INodeService_IFundChannel_Cancel;
    fundChannel_Complete: INodeService_IFundChannel_Complete;
    fundChannel: INodeService_IFundChannel;
    fundChannel_Start: INodeService_IFundChannel_Start;
    getLog: INodeService_IGetLog;
    funderUpdate: INodeService_IFunderUpdate;
    getRoute: INodeService_IGetRoute;
    listAddresses: INodeService_IListAddresses;
    listForwards: INodeService_IListForwards;
    listOffers: INodeService_IListOffers;
    listPays: INodeService_IListPays;
    listHtlcs: INodeService_IListHtlcs;
    multiFundChannel: INodeService_IMultiFundChannel;
    multiWithdraw: INodeService_IMultiWithdraw;
    offer: INodeService_IOffer;
    openChannel_Abort: INodeService_IOpenChannel_Abort;
    openChannel_Bump: INodeService_IOpenChannel_Bump;
    openChannel_Init: INodeService_IOpenChannel_Init;
    openChannel_Signed: INodeService_IOpenChannel_Signed;
    openChannel_Update: INodeService_IOpenChannel_Update;
    ping: INodeService_IPing;
    plugin: INodeService_IPlugin;
    renePayStatus: INodeService_IRenePayStatus;
    renePay: INodeService_IRenePay;
    reserveInputs: INodeService_IReserveInputs;
    sendCustomMsg: INodeService_ISendCustomMsg;
    sendInvoice: INodeService_ISendInvoice;
    setChannel: INodeService_ISetChannel;
    setConfig: INodeService_ISetConfig;
    setPsbtVersion: INodeService_ISetPsbtVersion;
    signInvoice: INodeService_ISignInvoice;
    signMessage: INodeService_ISignMessage;
    splice_Init: INodeService_ISplice_Init;
    splice_Signed: INodeService_ISplice_Signed;
    splice_Update: INodeService_ISplice_Update;
    devSplice: INodeService_IDevSplice;
    unreserveInputs: INodeService_IUnreserveInputs;
    upgradeWallet: INodeService_IUpgradeWallet;
    waitBlockHeight: INodeService_IWaitBlockHeight;
    wait: INodeService_IWait;
    listConfigs: INodeService_IListConfigs;
    stop: INodeService_IStop;
    help: INodeService_IHelp;
    preApproveKeysend: INodeService_IPreApproveKeysend;
    preApproveInvoice: INodeService_IPreApproveInvoice;
    staticBackup: INodeService_IStaticBackup;
    bkprChannelsApy: INodeService_IBkprChannelsApy;
    bkprDumpIncomeCsv: INodeService_IBkprDumpIncomeCsv;
    bkprInspect: INodeService_IBkprInspect;
    bkprListAccountEvents: INodeService_IBkprListAccountEvents;
    bkprListBalances: INodeService_IBkprListBalances;
    bkprListIncome: INodeService_IBkprListIncome;
    bkprEditDescriptionByPaymentId: INodeService_IBkprEditDescriptionByPaymentId;
    bkprEditDescriptionByOutpoint: INodeService_IBkprEditDescriptionByOutpoint;
    blacklistRune: INodeService_IBlacklistRune;
    checkRune: INodeService_ICheckRune;
    createRune: INodeService_ICreateRune;
    showRunes: INodeService_IShowRunes;
    askReneUnreserve: INodeService_IAskReneUnreserve;
    askReneListLayers: INodeService_IAskReneListLayers;
    askReneCreateLayer: INodeService_IAskReneCreateLayer;
    askReneRemoveLayer: INodeService_IAskReneRemoveLayer;
    askReneReserve: INodeService_IAskReneReserve;
    askReneAge: INodeService_IAskReneAge;
    getRoutes: INodeService_IGetRoutes;
    askReneDisableNode: INodeService_IAskReneDisableNode;
    askReneInformChannel: INodeService_IAskReneInformChannel;
    askReneCreateChannel: INodeService_IAskReneCreateChannel;
    askReneUpdateChannel: INodeService_IAskReneUpdateChannel;
    askReneBiasChannel: INodeService_IAskReneBiasChannel;
    askReneListReservations: INodeService_IAskReneListReservations;
    injectPaymentOnion: INodeService_IInjectPaymentOnion;
    xpay: INodeService_IXpay;
    subscribeBlockAdded: INodeService_ISubscribeBlockAdded;
    subscribeChannelOpenFailed: INodeService_ISubscribeChannelOpenFailed;
    subscribeChannelOpened: INodeService_ISubscribeChannelOpened;
    subscribeConnect: INodeService_ISubscribeConnect;
    subscribeCustomMsg: INodeService_ISubscribeCustomMsg;
}

interface INodeService_IGetinfo extends grpc.MethodDefinition<cln_node_pb.GetinfoRequest, cln_node_pb.GetinfoResponse> {
    path: "/cln.Node/Getinfo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.GetinfoRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.GetinfoRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.GetinfoResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.GetinfoResponse>;
}
interface INodeService_IListPeers extends grpc.MethodDefinition<cln_node_pb.ListpeersRequest, cln_node_pb.ListpeersResponse> {
    path: "/cln.Node/ListPeers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListpeersRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListpeersRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListpeersResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListpeersResponse>;
}
interface INodeService_IListFunds extends grpc.MethodDefinition<cln_node_pb.ListfundsRequest, cln_node_pb.ListfundsResponse> {
    path: "/cln.Node/ListFunds";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListfundsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListfundsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListfundsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListfundsResponse>;
}
interface INodeService_ISendPay extends grpc.MethodDefinition<cln_node_pb.SendpayRequest, cln_node_pb.SendpayResponse> {
    path: "/cln.Node/SendPay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SendpayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SendpayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SendpayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SendpayResponse>;
}
interface INodeService_IListChannels extends grpc.MethodDefinition<cln_node_pb.ListchannelsRequest, cln_node_pb.ListchannelsResponse> {
    path: "/cln.Node/ListChannels";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListchannelsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListchannelsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListchannelsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListchannelsResponse>;
}
interface INodeService_IAddGossip extends grpc.MethodDefinition<cln_node_pb.AddgossipRequest, cln_node_pb.AddgossipResponse> {
    path: "/cln.Node/AddGossip";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AddgossipRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AddgossipRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AddgossipResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AddgossipResponse>;
}
interface INodeService_IAddPsbtOutput extends grpc.MethodDefinition<cln_node_pb.AddpsbtoutputRequest, cln_node_pb.AddpsbtoutputResponse> {
    path: "/cln.Node/AddPsbtOutput";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AddpsbtoutputRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AddpsbtoutputRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AddpsbtoutputResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AddpsbtoutputResponse>;
}
interface INodeService_IAutoCleanOnce extends grpc.MethodDefinition<cln_node_pb.AutocleanonceRequest, cln_node_pb.AutocleanonceResponse> {
    path: "/cln.Node/AutoCleanOnce";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AutocleanonceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AutocleanonceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AutocleanonceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AutocleanonceResponse>;
}
interface INodeService_IAutoCleanStatus extends grpc.MethodDefinition<cln_node_pb.AutocleanstatusRequest, cln_node_pb.AutocleanstatusResponse> {
    path: "/cln.Node/AutoCleanStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AutocleanstatusRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AutocleanstatusRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AutocleanstatusResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AutocleanstatusResponse>;
}
interface INodeService_ICheckMessage extends grpc.MethodDefinition<cln_node_pb.CheckmessageRequest, cln_node_pb.CheckmessageResponse> {
    path: "/cln.Node/CheckMessage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.CheckmessageRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.CheckmessageRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CheckmessageResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CheckmessageResponse>;
}
interface INodeService_IClose extends grpc.MethodDefinition<cln_node_pb.CloseRequest, cln_node_pb.CloseResponse> {
    path: "/cln.Node/Close";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.CloseRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.CloseRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CloseResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CloseResponse>;
}
interface INodeService_IConnectPeer extends grpc.MethodDefinition<cln_node_pb.ConnectRequest, cln_node_pb.ConnectResponse> {
    path: "/cln.Node/ConnectPeer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ConnectRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ConnectRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ConnectResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ConnectResponse>;
}
interface INodeService_ICreateInvoice extends grpc.MethodDefinition<cln_node_pb.CreateinvoiceRequest, cln_node_pb.CreateinvoiceResponse> {
    path: "/cln.Node/CreateInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.CreateinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.CreateinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CreateinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CreateinvoiceResponse>;
}
interface INodeService_IDatastore extends grpc.MethodDefinition<cln_node_pb.DatastoreRequest, cln_node_pb.DatastoreResponse> {
    path: "/cln.Node/Datastore";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DatastoreRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DatastoreRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DatastoreResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DatastoreResponse>;
}
interface INodeService_IDatastoreUsage extends grpc.MethodDefinition<cln_node_pb.DatastoreusageRequest, cln_node_pb.DatastoreusageResponse> {
    path: "/cln.Node/DatastoreUsage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DatastoreusageRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DatastoreusageRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DatastoreusageResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DatastoreusageResponse>;
}
interface INodeService_ICreateOnion extends grpc.MethodDefinition<cln_node_pb.CreateonionRequest, cln_node_pb.CreateonionResponse> {
    path: "/cln.Node/CreateOnion";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.CreateonionRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.CreateonionRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CreateonionResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CreateonionResponse>;
}
interface INodeService_IDelDatastore extends grpc.MethodDefinition<cln_node_pb.DeldatastoreRequest, cln_node_pb.DeldatastoreResponse> {
    path: "/cln.Node/DelDatastore";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DeldatastoreRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DeldatastoreRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DeldatastoreResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DeldatastoreResponse>;
}
interface INodeService_IDelInvoice extends grpc.MethodDefinition<cln_node_pb.DelinvoiceRequest, cln_node_pb.DelinvoiceResponse> {
    path: "/cln.Node/DelInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DelinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DelinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DelinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DelinvoiceResponse>;
}
interface INodeService_IDevForgetChannel extends grpc.MethodDefinition<cln_node_pb.DevforgetchannelRequest, cln_node_pb.DevforgetchannelResponse> {
    path: "/cln.Node/DevForgetChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DevforgetchannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DevforgetchannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DevforgetchannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DevforgetchannelResponse>;
}
interface INodeService_IEmergencyRecover extends grpc.MethodDefinition<cln_node_pb.EmergencyrecoverRequest, cln_node_pb.EmergencyrecoverResponse> {
    path: "/cln.Node/EmergencyRecover";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.EmergencyrecoverRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.EmergencyrecoverRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.EmergencyrecoverResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.EmergencyrecoverResponse>;
}
interface INodeService_IGetEmergencyRecoverData extends grpc.MethodDefinition<cln_node_pb.GetemergencyrecoverdataRequest, cln_node_pb.GetemergencyrecoverdataResponse> {
    path: "/cln.Node/GetEmergencyRecoverData";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.GetemergencyrecoverdataRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.GetemergencyrecoverdataRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.GetemergencyrecoverdataResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.GetemergencyrecoverdataResponse>;
}
interface INodeService_IExposeSecret extends grpc.MethodDefinition<cln_node_pb.ExposesecretRequest, cln_node_pb.ExposesecretResponse> {
    path: "/cln.Node/ExposeSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ExposesecretRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ExposesecretRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ExposesecretResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ExposesecretResponse>;
}
interface INodeService_IRecover extends grpc.MethodDefinition<cln_node_pb.RecoverRequest, cln_node_pb.RecoverResponse> {
    path: "/cln.Node/Recover";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.RecoverRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.RecoverRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.RecoverResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.RecoverResponse>;
}
interface INodeService_IRecoverChannel extends grpc.MethodDefinition<cln_node_pb.RecoverchannelRequest, cln_node_pb.RecoverchannelResponse> {
    path: "/cln.Node/RecoverChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.RecoverchannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.RecoverchannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.RecoverchannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.RecoverchannelResponse>;
}
interface INodeService_IInvoice extends grpc.MethodDefinition<cln_node_pb.InvoiceRequest, cln_node_pb.InvoiceResponse> {
    path: "/cln.Node/Invoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.InvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.InvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.InvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.InvoiceResponse>;
}
interface INodeService_ICreateInvoiceRequest extends grpc.MethodDefinition<cln_node_pb.InvoicerequestRequest, cln_node_pb.InvoicerequestResponse> {
    path: "/cln.Node/CreateInvoiceRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.InvoicerequestRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.InvoicerequestRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.InvoicerequestResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.InvoicerequestResponse>;
}
interface INodeService_IDisableInvoiceRequest extends grpc.MethodDefinition<cln_node_pb.DisableinvoicerequestRequest, cln_node_pb.DisableinvoicerequestResponse> {
    path: "/cln.Node/DisableInvoiceRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DisableinvoicerequestRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DisableinvoicerequestRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DisableinvoicerequestResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DisableinvoicerequestResponse>;
}
interface INodeService_IListInvoiceRequests extends grpc.MethodDefinition<cln_node_pb.ListinvoicerequestsRequest, cln_node_pb.ListinvoicerequestsResponse> {
    path: "/cln.Node/ListInvoiceRequests";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListinvoicerequestsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListinvoicerequestsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListinvoicerequestsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListinvoicerequestsResponse>;
}
interface INodeService_IListDatastore extends grpc.MethodDefinition<cln_node_pb.ListdatastoreRequest, cln_node_pb.ListdatastoreResponse> {
    path: "/cln.Node/ListDatastore";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListdatastoreRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListdatastoreRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListdatastoreResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListdatastoreResponse>;
}
interface INodeService_IListInvoices extends grpc.MethodDefinition<cln_node_pb.ListinvoicesRequest, cln_node_pb.ListinvoicesResponse> {
    path: "/cln.Node/ListInvoices";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListinvoicesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListinvoicesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListinvoicesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListinvoicesResponse>;
}
interface INodeService_ISendOnion extends grpc.MethodDefinition<cln_node_pb.SendonionRequest, cln_node_pb.SendonionResponse> {
    path: "/cln.Node/SendOnion";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SendonionRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SendonionRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SendonionResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SendonionResponse>;
}
interface INodeService_IListSendPays extends grpc.MethodDefinition<cln_node_pb.ListsendpaysRequest, cln_node_pb.ListsendpaysResponse> {
    path: "/cln.Node/ListSendPays";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListsendpaysRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListsendpaysRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListsendpaysResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListsendpaysResponse>;
}
interface INodeService_IListTransactions extends grpc.MethodDefinition<cln_node_pb.ListtransactionsRequest, cln_node_pb.ListtransactionsResponse> {
    path: "/cln.Node/ListTransactions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListtransactionsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListtransactionsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListtransactionsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListtransactionsResponse>;
}
interface INodeService_IMakeSecret extends grpc.MethodDefinition<cln_node_pb.MakesecretRequest, cln_node_pb.MakesecretResponse> {
    path: "/cln.Node/MakeSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.MakesecretRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.MakesecretRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.MakesecretResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.MakesecretResponse>;
}
interface INodeService_IPay extends grpc.MethodDefinition<cln_node_pb.PayRequest, cln_node_pb.PayResponse> {
    path: "/cln.Node/Pay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.PayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.PayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.PayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.PayResponse>;
}
interface INodeService_IListNodes extends grpc.MethodDefinition<cln_node_pb.ListnodesRequest, cln_node_pb.ListnodesResponse> {
    path: "/cln.Node/ListNodes";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListnodesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListnodesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListnodesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListnodesResponse>;
}
interface INodeService_IWaitAnyInvoice extends grpc.MethodDefinition<cln_node_pb.WaitanyinvoiceRequest, cln_node_pb.WaitanyinvoiceResponse> {
    path: "/cln.Node/WaitAnyInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.WaitanyinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.WaitanyinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.WaitanyinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.WaitanyinvoiceResponse>;
}
interface INodeService_IWaitInvoice extends grpc.MethodDefinition<cln_node_pb.WaitinvoiceRequest, cln_node_pb.WaitinvoiceResponse> {
    path: "/cln.Node/WaitInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.WaitinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.WaitinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.WaitinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.WaitinvoiceResponse>;
}
interface INodeService_IWaitSendPay extends grpc.MethodDefinition<cln_node_pb.WaitsendpayRequest, cln_node_pb.WaitsendpayResponse> {
    path: "/cln.Node/WaitSendPay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.WaitsendpayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.WaitsendpayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.WaitsendpayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.WaitsendpayResponse>;
}
interface INodeService_INewAddr extends grpc.MethodDefinition<cln_node_pb.NewaddrRequest, cln_node_pb.NewaddrResponse> {
    path: "/cln.Node/NewAddr";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.NewaddrRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.NewaddrRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.NewaddrResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.NewaddrResponse>;
}
interface INodeService_IWithdraw extends grpc.MethodDefinition<cln_node_pb.WithdrawRequest, cln_node_pb.WithdrawResponse> {
    path: "/cln.Node/Withdraw";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.WithdrawRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.WithdrawRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.WithdrawResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.WithdrawResponse>;
}
interface INodeService_IKeySend extends grpc.MethodDefinition<cln_node_pb.KeysendRequest, cln_node_pb.KeysendResponse> {
    path: "/cln.Node/KeySend";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.KeysendRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.KeysendRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.KeysendResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.KeysendResponse>;
}
interface INodeService_IFundPsbt extends grpc.MethodDefinition<cln_node_pb.FundpsbtRequest, cln_node_pb.FundpsbtResponse> {
    path: "/cln.Node/FundPsbt";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.FundpsbtRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.FundpsbtRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.FundpsbtResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.FundpsbtResponse>;
}
interface INodeService_ISendPsbt extends grpc.MethodDefinition<cln_node_pb.SendpsbtRequest, cln_node_pb.SendpsbtResponse> {
    path: "/cln.Node/SendPsbt";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SendpsbtRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SendpsbtRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SendpsbtResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SendpsbtResponse>;
}
interface INodeService_ISignPsbt extends grpc.MethodDefinition<cln_node_pb.SignpsbtRequest, cln_node_pb.SignpsbtResponse> {
    path: "/cln.Node/SignPsbt";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SignpsbtRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SignpsbtRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SignpsbtResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SignpsbtResponse>;
}
interface INodeService_IUtxoPsbt extends grpc.MethodDefinition<cln_node_pb.UtxopsbtRequest, cln_node_pb.UtxopsbtResponse> {
    path: "/cln.Node/UtxoPsbt";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.UtxopsbtRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.UtxopsbtRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.UtxopsbtResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.UtxopsbtResponse>;
}
interface INodeService_ITxDiscard extends grpc.MethodDefinition<cln_node_pb.TxdiscardRequest, cln_node_pb.TxdiscardResponse> {
    path: "/cln.Node/TxDiscard";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.TxdiscardRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.TxdiscardRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.TxdiscardResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.TxdiscardResponse>;
}
interface INodeService_ITxPrepare extends grpc.MethodDefinition<cln_node_pb.TxprepareRequest, cln_node_pb.TxprepareResponse> {
    path: "/cln.Node/TxPrepare";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.TxprepareRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.TxprepareRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.TxprepareResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.TxprepareResponse>;
}
interface INodeService_ITxSend extends grpc.MethodDefinition<cln_node_pb.TxsendRequest, cln_node_pb.TxsendResponse> {
    path: "/cln.Node/TxSend";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.TxsendRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.TxsendRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.TxsendResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.TxsendResponse>;
}
interface INodeService_IListPeerChannels extends grpc.MethodDefinition<cln_node_pb.ListpeerchannelsRequest, cln_node_pb.ListpeerchannelsResponse> {
    path: "/cln.Node/ListPeerChannels";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListpeerchannelsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListpeerchannelsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListpeerchannelsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListpeerchannelsResponse>;
}
interface INodeService_IListClosedChannels extends grpc.MethodDefinition<cln_node_pb.ListclosedchannelsRequest, cln_node_pb.ListclosedchannelsResponse> {
    path: "/cln.Node/ListClosedChannels";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListclosedchannelsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListclosedchannelsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListclosedchannelsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListclosedchannelsResponse>;
}
interface INodeService_IDecodePay extends grpc.MethodDefinition<cln_node_pb.DecodepayRequest, cln_node_pb.DecodepayResponse> {
    path: "/cln.Node/DecodePay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DecodepayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DecodepayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DecodepayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DecodepayResponse>;
}
interface INodeService_IDecode extends grpc.MethodDefinition<cln_node_pb.DecodeRequest, cln_node_pb.DecodeResponse> {
    path: "/cln.Node/Decode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DecodeRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DecodeRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DecodeResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DecodeResponse>;
}
interface INodeService_IDelPay extends grpc.MethodDefinition<cln_node_pb.DelpayRequest, cln_node_pb.DelpayResponse> {
    path: "/cln.Node/DelPay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DelpayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DelpayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DelpayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DelpayResponse>;
}
interface INodeService_IDelForward extends grpc.MethodDefinition<cln_node_pb.DelforwardRequest, cln_node_pb.DelforwardResponse> {
    path: "/cln.Node/DelForward";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DelforwardRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DelforwardRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DelforwardResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DelforwardResponse>;
}
interface INodeService_IDisableOffer extends grpc.MethodDefinition<cln_node_pb.DisableofferRequest, cln_node_pb.DisableofferResponse> {
    path: "/cln.Node/DisableOffer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DisableofferRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DisableofferRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DisableofferResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DisableofferResponse>;
}
interface INodeService_IEnableOffer extends grpc.MethodDefinition<cln_node_pb.EnableofferRequest, cln_node_pb.EnableofferResponse> {
    path: "/cln.Node/EnableOffer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.EnableofferRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.EnableofferRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.EnableofferResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.EnableofferResponse>;
}
interface INodeService_IDisconnect extends grpc.MethodDefinition<cln_node_pb.DisconnectRequest, cln_node_pb.DisconnectResponse> {
    path: "/cln.Node/Disconnect";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DisconnectRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DisconnectRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DisconnectResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DisconnectResponse>;
}
interface INodeService_IFeerates extends grpc.MethodDefinition<cln_node_pb.FeeratesRequest, cln_node_pb.FeeratesResponse> {
    path: "/cln.Node/Feerates";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.FeeratesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.FeeratesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.FeeratesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.FeeratesResponse>;
}
interface INodeService_IFetchInvoice extends grpc.MethodDefinition<cln_node_pb.FetchinvoiceRequest, cln_node_pb.FetchinvoiceResponse> {
    path: "/cln.Node/FetchInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.FetchinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.FetchinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.FetchinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.FetchinvoiceResponse>;
}
interface INodeService_IFundChannel_Cancel extends grpc.MethodDefinition<cln_node_pb.Fundchannel_cancelRequest, cln_node_pb.Fundchannel_cancelResponse> {
    path: "/cln.Node/FundChannel_Cancel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Fundchannel_cancelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Fundchannel_cancelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Fundchannel_cancelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Fundchannel_cancelResponse>;
}
interface INodeService_IFundChannel_Complete extends grpc.MethodDefinition<cln_node_pb.Fundchannel_completeRequest, cln_node_pb.Fundchannel_completeResponse> {
    path: "/cln.Node/FundChannel_Complete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Fundchannel_completeRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Fundchannel_completeRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Fundchannel_completeResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Fundchannel_completeResponse>;
}
interface INodeService_IFundChannel extends grpc.MethodDefinition<cln_node_pb.FundchannelRequest, cln_node_pb.FundchannelResponse> {
    path: "/cln.Node/FundChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.FundchannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.FundchannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.FundchannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.FundchannelResponse>;
}
interface INodeService_IFundChannel_Start extends grpc.MethodDefinition<cln_node_pb.Fundchannel_startRequest, cln_node_pb.Fundchannel_startResponse> {
    path: "/cln.Node/FundChannel_Start";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Fundchannel_startRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Fundchannel_startRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Fundchannel_startResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Fundchannel_startResponse>;
}
interface INodeService_IGetLog extends grpc.MethodDefinition<cln_node_pb.GetlogRequest, cln_node_pb.GetlogResponse> {
    path: "/cln.Node/GetLog";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.GetlogRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.GetlogRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.GetlogResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.GetlogResponse>;
}
interface INodeService_IFunderUpdate extends grpc.MethodDefinition<cln_node_pb.FunderupdateRequest, cln_node_pb.FunderupdateResponse> {
    path: "/cln.Node/FunderUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.FunderupdateRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.FunderupdateRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.FunderupdateResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.FunderupdateResponse>;
}
interface INodeService_IGetRoute extends grpc.MethodDefinition<cln_node_pb.GetrouteRequest, cln_node_pb.GetrouteResponse> {
    path: "/cln.Node/GetRoute";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.GetrouteRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.GetrouteRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.GetrouteResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.GetrouteResponse>;
}
interface INodeService_IListAddresses extends grpc.MethodDefinition<cln_node_pb.ListaddressesRequest, cln_node_pb.ListaddressesResponse> {
    path: "/cln.Node/ListAddresses";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListaddressesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListaddressesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListaddressesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListaddressesResponse>;
}
interface INodeService_IListForwards extends grpc.MethodDefinition<cln_node_pb.ListforwardsRequest, cln_node_pb.ListforwardsResponse> {
    path: "/cln.Node/ListForwards";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListforwardsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListforwardsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListforwardsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListforwardsResponse>;
}
interface INodeService_IListOffers extends grpc.MethodDefinition<cln_node_pb.ListoffersRequest, cln_node_pb.ListoffersResponse> {
    path: "/cln.Node/ListOffers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListoffersRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListoffersRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListoffersResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListoffersResponse>;
}
interface INodeService_IListPays extends grpc.MethodDefinition<cln_node_pb.ListpaysRequest, cln_node_pb.ListpaysResponse> {
    path: "/cln.Node/ListPays";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListpaysRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListpaysRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListpaysResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListpaysResponse>;
}
interface INodeService_IListHtlcs extends grpc.MethodDefinition<cln_node_pb.ListhtlcsRequest, cln_node_pb.ListhtlcsResponse> {
    path: "/cln.Node/ListHtlcs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListhtlcsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListhtlcsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListhtlcsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListhtlcsResponse>;
}
interface INodeService_IMultiFundChannel extends grpc.MethodDefinition<cln_node_pb.MultifundchannelRequest, cln_node_pb.MultifundchannelResponse> {
    path: "/cln.Node/MultiFundChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.MultifundchannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.MultifundchannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.MultifundchannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.MultifundchannelResponse>;
}
interface INodeService_IMultiWithdraw extends grpc.MethodDefinition<cln_node_pb.MultiwithdrawRequest, cln_node_pb.MultiwithdrawResponse> {
    path: "/cln.Node/MultiWithdraw";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.MultiwithdrawRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.MultiwithdrawRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.MultiwithdrawResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.MultiwithdrawResponse>;
}
interface INodeService_IOffer extends grpc.MethodDefinition<cln_node_pb.OfferRequest, cln_node_pb.OfferResponse> {
    path: "/cln.Node/Offer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.OfferRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.OfferRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.OfferResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.OfferResponse>;
}
interface INodeService_IOpenChannel_Abort extends grpc.MethodDefinition<cln_node_pb.Openchannel_abortRequest, cln_node_pb.Openchannel_abortResponse> {
    path: "/cln.Node/OpenChannel_Abort";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Openchannel_abortRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Openchannel_abortRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Openchannel_abortResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Openchannel_abortResponse>;
}
interface INodeService_IOpenChannel_Bump extends grpc.MethodDefinition<cln_node_pb.Openchannel_bumpRequest, cln_node_pb.Openchannel_bumpResponse> {
    path: "/cln.Node/OpenChannel_Bump";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Openchannel_bumpRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Openchannel_bumpRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Openchannel_bumpResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Openchannel_bumpResponse>;
}
interface INodeService_IOpenChannel_Init extends grpc.MethodDefinition<cln_node_pb.Openchannel_initRequest, cln_node_pb.Openchannel_initResponse> {
    path: "/cln.Node/OpenChannel_Init";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Openchannel_initRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Openchannel_initRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Openchannel_initResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Openchannel_initResponse>;
}
interface INodeService_IOpenChannel_Signed extends grpc.MethodDefinition<cln_node_pb.Openchannel_signedRequest, cln_node_pb.Openchannel_signedResponse> {
    path: "/cln.Node/OpenChannel_Signed";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Openchannel_signedRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Openchannel_signedRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Openchannel_signedResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Openchannel_signedResponse>;
}
interface INodeService_IOpenChannel_Update extends grpc.MethodDefinition<cln_node_pb.Openchannel_updateRequest, cln_node_pb.Openchannel_updateResponse> {
    path: "/cln.Node/OpenChannel_Update";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Openchannel_updateRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Openchannel_updateRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Openchannel_updateResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Openchannel_updateResponse>;
}
interface INodeService_IPing extends grpc.MethodDefinition<cln_node_pb.PingRequest, cln_node_pb.PingResponse> {
    path: "/cln.Node/Ping";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.PingRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.PingRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.PingResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.PingResponse>;
}
interface INodeService_IPlugin extends grpc.MethodDefinition<cln_node_pb.PluginRequest, cln_node_pb.PluginResponse> {
    path: "/cln.Node/Plugin";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.PluginRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.PluginRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.PluginResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.PluginResponse>;
}
interface INodeService_IRenePayStatus extends grpc.MethodDefinition<cln_node_pb.RenepaystatusRequest, cln_node_pb.RenepaystatusResponse> {
    path: "/cln.Node/RenePayStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.RenepaystatusRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.RenepaystatusRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.RenepaystatusResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.RenepaystatusResponse>;
}
interface INodeService_IRenePay extends grpc.MethodDefinition<cln_node_pb.RenepayRequest, cln_node_pb.RenepayResponse> {
    path: "/cln.Node/RenePay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.RenepayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.RenepayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.RenepayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.RenepayResponse>;
}
interface INodeService_IReserveInputs extends grpc.MethodDefinition<cln_node_pb.ReserveinputsRequest, cln_node_pb.ReserveinputsResponse> {
    path: "/cln.Node/ReserveInputs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ReserveinputsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ReserveinputsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ReserveinputsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ReserveinputsResponse>;
}
interface INodeService_ISendCustomMsg extends grpc.MethodDefinition<cln_node_pb.SendcustommsgRequest, cln_node_pb.SendcustommsgResponse> {
    path: "/cln.Node/SendCustomMsg";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SendcustommsgRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SendcustommsgRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SendcustommsgResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SendcustommsgResponse>;
}
interface INodeService_ISendInvoice extends grpc.MethodDefinition<cln_node_pb.SendinvoiceRequest, cln_node_pb.SendinvoiceResponse> {
    path: "/cln.Node/SendInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SendinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SendinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SendinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SendinvoiceResponse>;
}
interface INodeService_ISetChannel extends grpc.MethodDefinition<cln_node_pb.SetchannelRequest, cln_node_pb.SetchannelResponse> {
    path: "/cln.Node/SetChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SetchannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SetchannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SetchannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SetchannelResponse>;
}
interface INodeService_ISetConfig extends grpc.MethodDefinition<cln_node_pb.SetconfigRequest, cln_node_pb.SetconfigResponse> {
    path: "/cln.Node/SetConfig";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SetconfigRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SetconfigRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SetconfigResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SetconfigResponse>;
}
interface INodeService_ISetPsbtVersion extends grpc.MethodDefinition<cln_node_pb.SetpsbtversionRequest, cln_node_pb.SetpsbtversionResponse> {
    path: "/cln.Node/SetPsbtVersion";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SetpsbtversionRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SetpsbtversionRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SetpsbtversionResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SetpsbtversionResponse>;
}
interface INodeService_ISignInvoice extends grpc.MethodDefinition<cln_node_pb.SigninvoiceRequest, cln_node_pb.SigninvoiceResponse> {
    path: "/cln.Node/SignInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SigninvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SigninvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SigninvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SigninvoiceResponse>;
}
interface INodeService_ISignMessage extends grpc.MethodDefinition<cln_node_pb.SignmessageRequest, cln_node_pb.SignmessageResponse> {
    path: "/cln.Node/SignMessage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.SignmessageRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.SignmessageRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.SignmessageResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.SignmessageResponse>;
}
interface INodeService_ISplice_Init extends grpc.MethodDefinition<cln_node_pb.Splice_initRequest, cln_node_pb.Splice_initResponse> {
    path: "/cln.Node/Splice_Init";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Splice_initRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Splice_initRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Splice_initResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Splice_initResponse>;
}
interface INodeService_ISplice_Signed extends grpc.MethodDefinition<cln_node_pb.Splice_signedRequest, cln_node_pb.Splice_signedResponse> {
    path: "/cln.Node/Splice_Signed";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Splice_signedRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Splice_signedRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Splice_signedResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Splice_signedResponse>;
}
interface INodeService_ISplice_Update extends grpc.MethodDefinition<cln_node_pb.Splice_updateRequest, cln_node_pb.Splice_updateResponse> {
    path: "/cln.Node/Splice_Update";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.Splice_updateRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.Splice_updateRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.Splice_updateResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.Splice_updateResponse>;
}
interface INodeService_IDevSplice extends grpc.MethodDefinition<cln_node_pb.DevspliceRequest, cln_node_pb.DevspliceResponse> {
    path: "/cln.Node/DevSplice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.DevspliceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.DevspliceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.DevspliceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.DevspliceResponse>;
}
interface INodeService_IUnreserveInputs extends grpc.MethodDefinition<cln_node_pb.UnreserveinputsRequest, cln_node_pb.UnreserveinputsResponse> {
    path: "/cln.Node/UnreserveInputs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.UnreserveinputsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.UnreserveinputsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.UnreserveinputsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.UnreserveinputsResponse>;
}
interface INodeService_IUpgradeWallet extends grpc.MethodDefinition<cln_node_pb.UpgradewalletRequest, cln_node_pb.UpgradewalletResponse> {
    path: "/cln.Node/UpgradeWallet";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.UpgradewalletRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.UpgradewalletRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.UpgradewalletResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.UpgradewalletResponse>;
}
interface INodeService_IWaitBlockHeight extends grpc.MethodDefinition<cln_node_pb.WaitblockheightRequest, cln_node_pb.WaitblockheightResponse> {
    path: "/cln.Node/WaitBlockHeight";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.WaitblockheightRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.WaitblockheightRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.WaitblockheightResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.WaitblockheightResponse>;
}
interface INodeService_IWait extends grpc.MethodDefinition<cln_node_pb.WaitRequest, cln_node_pb.WaitResponse> {
    path: "/cln.Node/Wait";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.WaitRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.WaitRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.WaitResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.WaitResponse>;
}
interface INodeService_IListConfigs extends grpc.MethodDefinition<cln_node_pb.ListconfigsRequest, cln_node_pb.ListconfigsResponse> {
    path: "/cln.Node/ListConfigs";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ListconfigsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ListconfigsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ListconfigsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ListconfigsResponse>;
}
interface INodeService_IStop extends grpc.MethodDefinition<cln_node_pb.StopRequest, cln_node_pb.StopResponse> {
    path: "/cln.Node/Stop";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.StopRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StopRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.StopResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.StopResponse>;
}
interface INodeService_IHelp extends grpc.MethodDefinition<cln_node_pb.HelpRequest, cln_node_pb.HelpResponse> {
    path: "/cln.Node/Help";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.HelpRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.HelpRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.HelpResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.HelpResponse>;
}
interface INodeService_IPreApproveKeysend extends grpc.MethodDefinition<cln_node_pb.PreapprovekeysendRequest, cln_node_pb.PreapprovekeysendResponse> {
    path: "/cln.Node/PreApproveKeysend";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.PreapprovekeysendRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.PreapprovekeysendRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.PreapprovekeysendResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.PreapprovekeysendResponse>;
}
interface INodeService_IPreApproveInvoice extends grpc.MethodDefinition<cln_node_pb.PreapproveinvoiceRequest, cln_node_pb.PreapproveinvoiceResponse> {
    path: "/cln.Node/PreApproveInvoice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.PreapproveinvoiceRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.PreapproveinvoiceRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.PreapproveinvoiceResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.PreapproveinvoiceResponse>;
}
interface INodeService_IStaticBackup extends grpc.MethodDefinition<cln_node_pb.StaticbackupRequest, cln_node_pb.StaticbackupResponse> {
    path: "/cln.Node/StaticBackup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.StaticbackupRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StaticbackupRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.StaticbackupResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.StaticbackupResponse>;
}
interface INodeService_IBkprChannelsApy extends grpc.MethodDefinition<cln_node_pb.BkprchannelsapyRequest, cln_node_pb.BkprchannelsapyResponse> {
    path: "/cln.Node/BkprChannelsApy";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkprchannelsapyRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkprchannelsapyRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkprchannelsapyResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkprchannelsapyResponse>;
}
interface INodeService_IBkprDumpIncomeCsv extends grpc.MethodDefinition<cln_node_pb.BkprdumpincomecsvRequest, cln_node_pb.BkprdumpincomecsvResponse> {
    path: "/cln.Node/BkprDumpIncomeCsv";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkprdumpincomecsvRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkprdumpincomecsvRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkprdumpincomecsvResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkprdumpincomecsvResponse>;
}
interface INodeService_IBkprInspect extends grpc.MethodDefinition<cln_node_pb.BkprinspectRequest, cln_node_pb.BkprinspectResponse> {
    path: "/cln.Node/BkprInspect";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkprinspectRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkprinspectRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkprinspectResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkprinspectResponse>;
}
interface INodeService_IBkprListAccountEvents extends grpc.MethodDefinition<cln_node_pb.BkprlistaccounteventsRequest, cln_node_pb.BkprlistaccounteventsResponse> {
    path: "/cln.Node/BkprListAccountEvents";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkprlistaccounteventsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkprlistaccounteventsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkprlistaccounteventsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkprlistaccounteventsResponse>;
}
interface INodeService_IBkprListBalances extends grpc.MethodDefinition<cln_node_pb.BkprlistbalancesRequest, cln_node_pb.BkprlistbalancesResponse> {
    path: "/cln.Node/BkprListBalances";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkprlistbalancesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkprlistbalancesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkprlistbalancesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkprlistbalancesResponse>;
}
interface INodeService_IBkprListIncome extends grpc.MethodDefinition<cln_node_pb.BkprlistincomeRequest, cln_node_pb.BkprlistincomeResponse> {
    path: "/cln.Node/BkprListIncome";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkprlistincomeRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkprlistincomeRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkprlistincomeResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkprlistincomeResponse>;
}
interface INodeService_IBkprEditDescriptionByPaymentId extends grpc.MethodDefinition<cln_node_pb.BkpreditdescriptionbypaymentidRequest, cln_node_pb.BkpreditdescriptionbypaymentidResponse> {
    path: "/cln.Node/BkprEditDescriptionByPaymentId";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkpreditdescriptionbypaymentidRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkpreditdescriptionbypaymentidRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkpreditdescriptionbypaymentidResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkpreditdescriptionbypaymentidResponse>;
}
interface INodeService_IBkprEditDescriptionByOutpoint extends grpc.MethodDefinition<cln_node_pb.BkpreditdescriptionbyoutpointRequest, cln_node_pb.BkpreditdescriptionbyoutpointResponse> {
    path: "/cln.Node/BkprEditDescriptionByOutpoint";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BkpreditdescriptionbyoutpointRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BkpreditdescriptionbyoutpointRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BkpreditdescriptionbyoutpointResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BkpreditdescriptionbyoutpointResponse>;
}
interface INodeService_IBlacklistRune extends grpc.MethodDefinition<cln_node_pb.BlacklistruneRequest, cln_node_pb.BlacklistruneResponse> {
    path: "/cln.Node/BlacklistRune";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.BlacklistruneRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.BlacklistruneRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BlacklistruneResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BlacklistruneResponse>;
}
interface INodeService_ICheckRune extends grpc.MethodDefinition<cln_node_pb.CheckruneRequest, cln_node_pb.CheckruneResponse> {
    path: "/cln.Node/CheckRune";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.CheckruneRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.CheckruneRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CheckruneResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CheckruneResponse>;
}
interface INodeService_ICreateRune extends grpc.MethodDefinition<cln_node_pb.CreateruneRequest, cln_node_pb.CreateruneResponse> {
    path: "/cln.Node/CreateRune";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.CreateruneRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.CreateruneRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CreateruneResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CreateruneResponse>;
}
interface INodeService_IShowRunes extends grpc.MethodDefinition<cln_node_pb.ShowrunesRequest, cln_node_pb.ShowrunesResponse> {
    path: "/cln.Node/ShowRunes";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.ShowrunesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.ShowrunesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ShowrunesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ShowrunesResponse>;
}
interface INodeService_IAskReneUnreserve extends grpc.MethodDefinition<cln_node_pb.AskreneunreserveRequest, cln_node_pb.AskreneunreserveResponse> {
    path: "/cln.Node/AskReneUnreserve";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskreneunreserveRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskreneunreserveRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskreneunreserveResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskreneunreserveResponse>;
}
interface INodeService_IAskReneListLayers extends grpc.MethodDefinition<cln_node_pb.AskrenelistlayersRequest, cln_node_pb.AskrenelistlayersResponse> {
    path: "/cln.Node/AskReneListLayers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenelistlayersRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenelistlayersRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenelistlayersResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenelistlayersResponse>;
}
interface INodeService_IAskReneCreateLayer extends grpc.MethodDefinition<cln_node_pb.AskrenecreatelayerRequest, cln_node_pb.AskrenecreatelayerResponse> {
    path: "/cln.Node/AskReneCreateLayer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenecreatelayerRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenecreatelayerRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenecreatelayerResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenecreatelayerResponse>;
}
interface INodeService_IAskReneRemoveLayer extends grpc.MethodDefinition<cln_node_pb.AskreneremovelayerRequest, cln_node_pb.AskreneremovelayerResponse> {
    path: "/cln.Node/AskReneRemoveLayer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskreneremovelayerRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskreneremovelayerRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskreneremovelayerResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskreneremovelayerResponse>;
}
interface INodeService_IAskReneReserve extends grpc.MethodDefinition<cln_node_pb.AskrenereserveRequest, cln_node_pb.AskrenereserveResponse> {
    path: "/cln.Node/AskReneReserve";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenereserveRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenereserveRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenereserveResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenereserveResponse>;
}
interface INodeService_IAskReneAge extends grpc.MethodDefinition<cln_node_pb.AskreneageRequest, cln_node_pb.AskreneageResponse> {
    path: "/cln.Node/AskReneAge";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskreneageRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskreneageRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskreneageResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskreneageResponse>;
}
interface INodeService_IGetRoutes extends grpc.MethodDefinition<cln_node_pb.GetroutesRequest, cln_node_pb.GetroutesResponse> {
    path: "/cln.Node/GetRoutes";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.GetroutesRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.GetroutesRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.GetroutesResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.GetroutesResponse>;
}
interface INodeService_IAskReneDisableNode extends grpc.MethodDefinition<cln_node_pb.AskrenedisablenodeRequest, cln_node_pb.AskrenedisablenodeResponse> {
    path: "/cln.Node/AskReneDisableNode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenedisablenodeRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenedisablenodeRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenedisablenodeResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenedisablenodeResponse>;
}
interface INodeService_IAskReneInformChannel extends grpc.MethodDefinition<cln_node_pb.AskreneinformchannelRequest, cln_node_pb.AskreneinformchannelResponse> {
    path: "/cln.Node/AskReneInformChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskreneinformchannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskreneinformchannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskreneinformchannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskreneinformchannelResponse>;
}
interface INodeService_IAskReneCreateChannel extends grpc.MethodDefinition<cln_node_pb.AskrenecreatechannelRequest, cln_node_pb.AskrenecreatechannelResponse> {
    path: "/cln.Node/AskReneCreateChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenecreatechannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenecreatechannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenecreatechannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenecreatechannelResponse>;
}
interface INodeService_IAskReneUpdateChannel extends grpc.MethodDefinition<cln_node_pb.AskreneupdatechannelRequest, cln_node_pb.AskreneupdatechannelResponse> {
    path: "/cln.Node/AskReneUpdateChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskreneupdatechannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskreneupdatechannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskreneupdatechannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskreneupdatechannelResponse>;
}
interface INodeService_IAskReneBiasChannel extends grpc.MethodDefinition<cln_node_pb.AskrenebiaschannelRequest, cln_node_pb.AskrenebiaschannelResponse> {
    path: "/cln.Node/AskReneBiasChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenebiaschannelRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenebiaschannelRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenebiaschannelResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenebiaschannelResponse>;
}
interface INodeService_IAskReneListReservations extends grpc.MethodDefinition<cln_node_pb.AskrenelistreservationsRequest, cln_node_pb.AskrenelistreservationsResponse> {
    path: "/cln.Node/AskReneListReservations";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.AskrenelistreservationsRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.AskrenelistreservationsRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.AskrenelistreservationsResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.AskrenelistreservationsResponse>;
}
interface INodeService_IInjectPaymentOnion extends grpc.MethodDefinition<cln_node_pb.InjectpaymentonionRequest, cln_node_pb.InjectpaymentonionResponse> {
    path: "/cln.Node/InjectPaymentOnion";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.InjectpaymentonionRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.InjectpaymentonionRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.InjectpaymentonionResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.InjectpaymentonionResponse>;
}
interface INodeService_IXpay extends grpc.MethodDefinition<cln_node_pb.XpayRequest, cln_node_pb.XpayResponse> {
    path: "/cln.Node/Xpay";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<cln_node_pb.XpayRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.XpayRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.XpayResponse>;
    responseDeserialize: grpc.deserialize<cln_node_pb.XpayResponse>;
}
interface INodeService_ISubscribeBlockAdded extends grpc.MethodDefinition<cln_node_pb.StreamBlockAddedRequest, cln_node_pb.BlockAddedNotification> {
    path: "/cln.Node/SubscribeBlockAdded";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<cln_node_pb.StreamBlockAddedRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StreamBlockAddedRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.BlockAddedNotification>;
    responseDeserialize: grpc.deserialize<cln_node_pb.BlockAddedNotification>;
}
interface INodeService_ISubscribeChannelOpenFailed extends grpc.MethodDefinition<cln_node_pb.StreamChannelOpenFailedRequest, cln_node_pb.ChannelOpenFailedNotification> {
    path: "/cln.Node/SubscribeChannelOpenFailed";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<cln_node_pb.StreamChannelOpenFailedRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StreamChannelOpenFailedRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ChannelOpenFailedNotification>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ChannelOpenFailedNotification>;
}
interface INodeService_ISubscribeChannelOpened extends grpc.MethodDefinition<cln_node_pb.StreamChannelOpenedRequest, cln_node_pb.ChannelOpenedNotification> {
    path: "/cln.Node/SubscribeChannelOpened";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<cln_node_pb.StreamChannelOpenedRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StreamChannelOpenedRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.ChannelOpenedNotification>;
    responseDeserialize: grpc.deserialize<cln_node_pb.ChannelOpenedNotification>;
}
interface INodeService_ISubscribeConnect extends grpc.MethodDefinition<cln_node_pb.StreamConnectRequest, cln_node_pb.PeerConnectNotification> {
    path: "/cln.Node/SubscribeConnect";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<cln_node_pb.StreamConnectRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StreamConnectRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.PeerConnectNotification>;
    responseDeserialize: grpc.deserialize<cln_node_pb.PeerConnectNotification>;
}
interface INodeService_ISubscribeCustomMsg extends grpc.MethodDefinition<cln_node_pb.StreamCustomMsgRequest, cln_node_pb.CustomMsgNotification> {
    path: "/cln.Node/SubscribeCustomMsg";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<cln_node_pb.StreamCustomMsgRequest>;
    requestDeserialize: grpc.deserialize<cln_node_pb.StreamCustomMsgRequest>;
    responseSerialize: grpc.serialize<cln_node_pb.CustomMsgNotification>;
    responseDeserialize: grpc.deserialize<cln_node_pb.CustomMsgNotification>;
}

export const NodeService: INodeService;

export interface INodeServer extends grpc.UntypedServiceImplementation {
    getinfo: grpc.handleUnaryCall<cln_node_pb.GetinfoRequest, cln_node_pb.GetinfoResponse>;
    listPeers: grpc.handleUnaryCall<cln_node_pb.ListpeersRequest, cln_node_pb.ListpeersResponse>;
    listFunds: grpc.handleUnaryCall<cln_node_pb.ListfundsRequest, cln_node_pb.ListfundsResponse>;
    sendPay: grpc.handleUnaryCall<cln_node_pb.SendpayRequest, cln_node_pb.SendpayResponse>;
    listChannels: grpc.handleUnaryCall<cln_node_pb.ListchannelsRequest, cln_node_pb.ListchannelsResponse>;
    addGossip: grpc.handleUnaryCall<cln_node_pb.AddgossipRequest, cln_node_pb.AddgossipResponse>;
    addPsbtOutput: grpc.handleUnaryCall<cln_node_pb.AddpsbtoutputRequest, cln_node_pb.AddpsbtoutputResponse>;
    autoCleanOnce: grpc.handleUnaryCall<cln_node_pb.AutocleanonceRequest, cln_node_pb.AutocleanonceResponse>;
    autoCleanStatus: grpc.handleUnaryCall<cln_node_pb.AutocleanstatusRequest, cln_node_pb.AutocleanstatusResponse>;
    checkMessage: grpc.handleUnaryCall<cln_node_pb.CheckmessageRequest, cln_node_pb.CheckmessageResponse>;
    close: grpc.handleUnaryCall<cln_node_pb.CloseRequest, cln_node_pb.CloseResponse>;
    connectPeer: grpc.handleUnaryCall<cln_node_pb.ConnectRequest, cln_node_pb.ConnectResponse>;
    createInvoice: grpc.handleUnaryCall<cln_node_pb.CreateinvoiceRequest, cln_node_pb.CreateinvoiceResponse>;
    datastore: grpc.handleUnaryCall<cln_node_pb.DatastoreRequest, cln_node_pb.DatastoreResponse>;
    datastoreUsage: grpc.handleUnaryCall<cln_node_pb.DatastoreusageRequest, cln_node_pb.DatastoreusageResponse>;
    createOnion: grpc.handleUnaryCall<cln_node_pb.CreateonionRequest, cln_node_pb.CreateonionResponse>;
    delDatastore: grpc.handleUnaryCall<cln_node_pb.DeldatastoreRequest, cln_node_pb.DeldatastoreResponse>;
    delInvoice: grpc.handleUnaryCall<cln_node_pb.DelinvoiceRequest, cln_node_pb.DelinvoiceResponse>;
    devForgetChannel: grpc.handleUnaryCall<cln_node_pb.DevforgetchannelRequest, cln_node_pb.DevforgetchannelResponse>;
    emergencyRecover: grpc.handleUnaryCall<cln_node_pb.EmergencyrecoverRequest, cln_node_pb.EmergencyrecoverResponse>;
    getEmergencyRecoverData: grpc.handleUnaryCall<cln_node_pb.GetemergencyrecoverdataRequest, cln_node_pb.GetemergencyrecoverdataResponse>;
    exposeSecret: grpc.handleUnaryCall<cln_node_pb.ExposesecretRequest, cln_node_pb.ExposesecretResponse>;
    recover: grpc.handleUnaryCall<cln_node_pb.RecoverRequest, cln_node_pb.RecoverResponse>;
    recoverChannel: grpc.handleUnaryCall<cln_node_pb.RecoverchannelRequest, cln_node_pb.RecoverchannelResponse>;
    invoice: grpc.handleUnaryCall<cln_node_pb.InvoiceRequest, cln_node_pb.InvoiceResponse>;
    createInvoiceRequest: grpc.handleUnaryCall<cln_node_pb.InvoicerequestRequest, cln_node_pb.InvoicerequestResponse>;
    disableInvoiceRequest: grpc.handleUnaryCall<cln_node_pb.DisableinvoicerequestRequest, cln_node_pb.DisableinvoicerequestResponse>;
    listInvoiceRequests: grpc.handleUnaryCall<cln_node_pb.ListinvoicerequestsRequest, cln_node_pb.ListinvoicerequestsResponse>;
    listDatastore: grpc.handleUnaryCall<cln_node_pb.ListdatastoreRequest, cln_node_pb.ListdatastoreResponse>;
    listInvoices: grpc.handleUnaryCall<cln_node_pb.ListinvoicesRequest, cln_node_pb.ListinvoicesResponse>;
    sendOnion: grpc.handleUnaryCall<cln_node_pb.SendonionRequest, cln_node_pb.SendonionResponse>;
    listSendPays: grpc.handleUnaryCall<cln_node_pb.ListsendpaysRequest, cln_node_pb.ListsendpaysResponse>;
    listTransactions: grpc.handleUnaryCall<cln_node_pb.ListtransactionsRequest, cln_node_pb.ListtransactionsResponse>;
    makeSecret: grpc.handleUnaryCall<cln_node_pb.MakesecretRequest, cln_node_pb.MakesecretResponse>;
    pay: grpc.handleUnaryCall<cln_node_pb.PayRequest, cln_node_pb.PayResponse>;
    listNodes: grpc.handleUnaryCall<cln_node_pb.ListnodesRequest, cln_node_pb.ListnodesResponse>;
    waitAnyInvoice: grpc.handleUnaryCall<cln_node_pb.WaitanyinvoiceRequest, cln_node_pb.WaitanyinvoiceResponse>;
    waitInvoice: grpc.handleUnaryCall<cln_node_pb.WaitinvoiceRequest, cln_node_pb.WaitinvoiceResponse>;
    waitSendPay: grpc.handleUnaryCall<cln_node_pb.WaitsendpayRequest, cln_node_pb.WaitsendpayResponse>;
    newAddr: grpc.handleUnaryCall<cln_node_pb.NewaddrRequest, cln_node_pb.NewaddrResponse>;
    withdraw: grpc.handleUnaryCall<cln_node_pb.WithdrawRequest, cln_node_pb.WithdrawResponse>;
    keySend: grpc.handleUnaryCall<cln_node_pb.KeysendRequest, cln_node_pb.KeysendResponse>;
    fundPsbt: grpc.handleUnaryCall<cln_node_pb.FundpsbtRequest, cln_node_pb.FundpsbtResponse>;
    sendPsbt: grpc.handleUnaryCall<cln_node_pb.SendpsbtRequest, cln_node_pb.SendpsbtResponse>;
    signPsbt: grpc.handleUnaryCall<cln_node_pb.SignpsbtRequest, cln_node_pb.SignpsbtResponse>;
    utxoPsbt: grpc.handleUnaryCall<cln_node_pb.UtxopsbtRequest, cln_node_pb.UtxopsbtResponse>;
    txDiscard: grpc.handleUnaryCall<cln_node_pb.TxdiscardRequest, cln_node_pb.TxdiscardResponse>;
    txPrepare: grpc.handleUnaryCall<cln_node_pb.TxprepareRequest, cln_node_pb.TxprepareResponse>;
    txSend: grpc.handleUnaryCall<cln_node_pb.TxsendRequest, cln_node_pb.TxsendResponse>;
    listPeerChannels: grpc.handleUnaryCall<cln_node_pb.ListpeerchannelsRequest, cln_node_pb.ListpeerchannelsResponse>;
    listClosedChannels: grpc.handleUnaryCall<cln_node_pb.ListclosedchannelsRequest, cln_node_pb.ListclosedchannelsResponse>;
    decodePay: grpc.handleUnaryCall<cln_node_pb.DecodepayRequest, cln_node_pb.DecodepayResponse>;
    decode: grpc.handleUnaryCall<cln_node_pb.DecodeRequest, cln_node_pb.DecodeResponse>;
    delPay: grpc.handleUnaryCall<cln_node_pb.DelpayRequest, cln_node_pb.DelpayResponse>;
    delForward: grpc.handleUnaryCall<cln_node_pb.DelforwardRequest, cln_node_pb.DelforwardResponse>;
    disableOffer: grpc.handleUnaryCall<cln_node_pb.DisableofferRequest, cln_node_pb.DisableofferResponse>;
    enableOffer: grpc.handleUnaryCall<cln_node_pb.EnableofferRequest, cln_node_pb.EnableofferResponse>;
    disconnect: grpc.handleUnaryCall<cln_node_pb.DisconnectRequest, cln_node_pb.DisconnectResponse>;
    feerates: grpc.handleUnaryCall<cln_node_pb.FeeratesRequest, cln_node_pb.FeeratesResponse>;
    fetchInvoice: grpc.handleUnaryCall<cln_node_pb.FetchinvoiceRequest, cln_node_pb.FetchinvoiceResponse>;
    fundChannel_Cancel: grpc.handleUnaryCall<cln_node_pb.Fundchannel_cancelRequest, cln_node_pb.Fundchannel_cancelResponse>;
    fundChannel_Complete: grpc.handleUnaryCall<cln_node_pb.Fundchannel_completeRequest, cln_node_pb.Fundchannel_completeResponse>;
    fundChannel: grpc.handleUnaryCall<cln_node_pb.FundchannelRequest, cln_node_pb.FundchannelResponse>;
    fundChannel_Start: grpc.handleUnaryCall<cln_node_pb.Fundchannel_startRequest, cln_node_pb.Fundchannel_startResponse>;
    getLog: grpc.handleUnaryCall<cln_node_pb.GetlogRequest, cln_node_pb.GetlogResponse>;
    funderUpdate: grpc.handleUnaryCall<cln_node_pb.FunderupdateRequest, cln_node_pb.FunderupdateResponse>;
    getRoute: grpc.handleUnaryCall<cln_node_pb.GetrouteRequest, cln_node_pb.GetrouteResponse>;
    listAddresses: grpc.handleUnaryCall<cln_node_pb.ListaddressesRequest, cln_node_pb.ListaddressesResponse>;
    listForwards: grpc.handleUnaryCall<cln_node_pb.ListforwardsRequest, cln_node_pb.ListforwardsResponse>;
    listOffers: grpc.handleUnaryCall<cln_node_pb.ListoffersRequest, cln_node_pb.ListoffersResponse>;
    listPays: grpc.handleUnaryCall<cln_node_pb.ListpaysRequest, cln_node_pb.ListpaysResponse>;
    listHtlcs: grpc.handleUnaryCall<cln_node_pb.ListhtlcsRequest, cln_node_pb.ListhtlcsResponse>;
    multiFundChannel: grpc.handleUnaryCall<cln_node_pb.MultifundchannelRequest, cln_node_pb.MultifundchannelResponse>;
    multiWithdraw: grpc.handleUnaryCall<cln_node_pb.MultiwithdrawRequest, cln_node_pb.MultiwithdrawResponse>;
    offer: grpc.handleUnaryCall<cln_node_pb.OfferRequest, cln_node_pb.OfferResponse>;
    openChannel_Abort: grpc.handleUnaryCall<cln_node_pb.Openchannel_abortRequest, cln_node_pb.Openchannel_abortResponse>;
    openChannel_Bump: grpc.handleUnaryCall<cln_node_pb.Openchannel_bumpRequest, cln_node_pb.Openchannel_bumpResponse>;
    openChannel_Init: grpc.handleUnaryCall<cln_node_pb.Openchannel_initRequest, cln_node_pb.Openchannel_initResponse>;
    openChannel_Signed: grpc.handleUnaryCall<cln_node_pb.Openchannel_signedRequest, cln_node_pb.Openchannel_signedResponse>;
    openChannel_Update: grpc.handleUnaryCall<cln_node_pb.Openchannel_updateRequest, cln_node_pb.Openchannel_updateResponse>;
    ping: grpc.handleUnaryCall<cln_node_pb.PingRequest, cln_node_pb.PingResponse>;
    plugin: grpc.handleUnaryCall<cln_node_pb.PluginRequest, cln_node_pb.PluginResponse>;
    renePayStatus: grpc.handleUnaryCall<cln_node_pb.RenepaystatusRequest, cln_node_pb.RenepaystatusResponse>;
    renePay: grpc.handleUnaryCall<cln_node_pb.RenepayRequest, cln_node_pb.RenepayResponse>;
    reserveInputs: grpc.handleUnaryCall<cln_node_pb.ReserveinputsRequest, cln_node_pb.ReserveinputsResponse>;
    sendCustomMsg: grpc.handleUnaryCall<cln_node_pb.SendcustommsgRequest, cln_node_pb.SendcustommsgResponse>;
    sendInvoice: grpc.handleUnaryCall<cln_node_pb.SendinvoiceRequest, cln_node_pb.SendinvoiceResponse>;
    setChannel: grpc.handleUnaryCall<cln_node_pb.SetchannelRequest, cln_node_pb.SetchannelResponse>;
    setConfig: grpc.handleUnaryCall<cln_node_pb.SetconfigRequest, cln_node_pb.SetconfigResponse>;
    setPsbtVersion: grpc.handleUnaryCall<cln_node_pb.SetpsbtversionRequest, cln_node_pb.SetpsbtversionResponse>;
    signInvoice: grpc.handleUnaryCall<cln_node_pb.SigninvoiceRequest, cln_node_pb.SigninvoiceResponse>;
    signMessage: grpc.handleUnaryCall<cln_node_pb.SignmessageRequest, cln_node_pb.SignmessageResponse>;
    splice_Init: grpc.handleUnaryCall<cln_node_pb.Splice_initRequest, cln_node_pb.Splice_initResponse>;
    splice_Signed: grpc.handleUnaryCall<cln_node_pb.Splice_signedRequest, cln_node_pb.Splice_signedResponse>;
    splice_Update: grpc.handleUnaryCall<cln_node_pb.Splice_updateRequest, cln_node_pb.Splice_updateResponse>;
    devSplice: grpc.handleUnaryCall<cln_node_pb.DevspliceRequest, cln_node_pb.DevspliceResponse>;
    unreserveInputs: grpc.handleUnaryCall<cln_node_pb.UnreserveinputsRequest, cln_node_pb.UnreserveinputsResponse>;
    upgradeWallet: grpc.handleUnaryCall<cln_node_pb.UpgradewalletRequest, cln_node_pb.UpgradewalletResponse>;
    waitBlockHeight: grpc.handleUnaryCall<cln_node_pb.WaitblockheightRequest, cln_node_pb.WaitblockheightResponse>;
    wait: grpc.handleUnaryCall<cln_node_pb.WaitRequest, cln_node_pb.WaitResponse>;
    listConfigs: grpc.handleUnaryCall<cln_node_pb.ListconfigsRequest, cln_node_pb.ListconfigsResponse>;
    stop: grpc.handleUnaryCall<cln_node_pb.StopRequest, cln_node_pb.StopResponse>;
    help: grpc.handleUnaryCall<cln_node_pb.HelpRequest, cln_node_pb.HelpResponse>;
    preApproveKeysend: grpc.handleUnaryCall<cln_node_pb.PreapprovekeysendRequest, cln_node_pb.PreapprovekeysendResponse>;
    preApproveInvoice: grpc.handleUnaryCall<cln_node_pb.PreapproveinvoiceRequest, cln_node_pb.PreapproveinvoiceResponse>;
    staticBackup: grpc.handleUnaryCall<cln_node_pb.StaticbackupRequest, cln_node_pb.StaticbackupResponse>;
    bkprChannelsApy: grpc.handleUnaryCall<cln_node_pb.BkprchannelsapyRequest, cln_node_pb.BkprchannelsapyResponse>;
    bkprDumpIncomeCsv: grpc.handleUnaryCall<cln_node_pb.BkprdumpincomecsvRequest, cln_node_pb.BkprdumpincomecsvResponse>;
    bkprInspect: grpc.handleUnaryCall<cln_node_pb.BkprinspectRequest, cln_node_pb.BkprinspectResponse>;
    bkprListAccountEvents: grpc.handleUnaryCall<cln_node_pb.BkprlistaccounteventsRequest, cln_node_pb.BkprlistaccounteventsResponse>;
    bkprListBalances: grpc.handleUnaryCall<cln_node_pb.BkprlistbalancesRequest, cln_node_pb.BkprlistbalancesResponse>;
    bkprListIncome: grpc.handleUnaryCall<cln_node_pb.BkprlistincomeRequest, cln_node_pb.BkprlistincomeResponse>;
    bkprEditDescriptionByPaymentId: grpc.handleUnaryCall<cln_node_pb.BkpreditdescriptionbypaymentidRequest, cln_node_pb.BkpreditdescriptionbypaymentidResponse>;
    bkprEditDescriptionByOutpoint: grpc.handleUnaryCall<cln_node_pb.BkpreditdescriptionbyoutpointRequest, cln_node_pb.BkpreditdescriptionbyoutpointResponse>;
    blacklistRune: grpc.handleUnaryCall<cln_node_pb.BlacklistruneRequest, cln_node_pb.BlacklistruneResponse>;
    checkRune: grpc.handleUnaryCall<cln_node_pb.CheckruneRequest, cln_node_pb.CheckruneResponse>;
    createRune: grpc.handleUnaryCall<cln_node_pb.CreateruneRequest, cln_node_pb.CreateruneResponse>;
    showRunes: grpc.handleUnaryCall<cln_node_pb.ShowrunesRequest, cln_node_pb.ShowrunesResponse>;
    askReneUnreserve: grpc.handleUnaryCall<cln_node_pb.AskreneunreserveRequest, cln_node_pb.AskreneunreserveResponse>;
    askReneListLayers: grpc.handleUnaryCall<cln_node_pb.AskrenelistlayersRequest, cln_node_pb.AskrenelistlayersResponse>;
    askReneCreateLayer: grpc.handleUnaryCall<cln_node_pb.AskrenecreatelayerRequest, cln_node_pb.AskrenecreatelayerResponse>;
    askReneRemoveLayer: grpc.handleUnaryCall<cln_node_pb.AskreneremovelayerRequest, cln_node_pb.AskreneremovelayerResponse>;
    askReneReserve: grpc.handleUnaryCall<cln_node_pb.AskrenereserveRequest, cln_node_pb.AskrenereserveResponse>;
    askReneAge: grpc.handleUnaryCall<cln_node_pb.AskreneageRequest, cln_node_pb.AskreneageResponse>;
    getRoutes: grpc.handleUnaryCall<cln_node_pb.GetroutesRequest, cln_node_pb.GetroutesResponse>;
    askReneDisableNode: grpc.handleUnaryCall<cln_node_pb.AskrenedisablenodeRequest, cln_node_pb.AskrenedisablenodeResponse>;
    askReneInformChannel: grpc.handleUnaryCall<cln_node_pb.AskreneinformchannelRequest, cln_node_pb.AskreneinformchannelResponse>;
    askReneCreateChannel: grpc.handleUnaryCall<cln_node_pb.AskrenecreatechannelRequest, cln_node_pb.AskrenecreatechannelResponse>;
    askReneUpdateChannel: grpc.handleUnaryCall<cln_node_pb.AskreneupdatechannelRequest, cln_node_pb.AskreneupdatechannelResponse>;
    askReneBiasChannel: grpc.handleUnaryCall<cln_node_pb.AskrenebiaschannelRequest, cln_node_pb.AskrenebiaschannelResponse>;
    askReneListReservations: grpc.handleUnaryCall<cln_node_pb.AskrenelistreservationsRequest, cln_node_pb.AskrenelistreservationsResponse>;
    injectPaymentOnion: grpc.handleUnaryCall<cln_node_pb.InjectpaymentonionRequest, cln_node_pb.InjectpaymentonionResponse>;
    xpay: grpc.handleUnaryCall<cln_node_pb.XpayRequest, cln_node_pb.XpayResponse>;
    subscribeBlockAdded: grpc.handleServerStreamingCall<cln_node_pb.StreamBlockAddedRequest, cln_node_pb.BlockAddedNotification>;
    subscribeChannelOpenFailed: grpc.handleServerStreamingCall<cln_node_pb.StreamChannelOpenFailedRequest, cln_node_pb.ChannelOpenFailedNotification>;
    subscribeChannelOpened: grpc.handleServerStreamingCall<cln_node_pb.StreamChannelOpenedRequest, cln_node_pb.ChannelOpenedNotification>;
    subscribeConnect: grpc.handleServerStreamingCall<cln_node_pb.StreamConnectRequest, cln_node_pb.PeerConnectNotification>;
    subscribeCustomMsg: grpc.handleServerStreamingCall<cln_node_pb.StreamCustomMsgRequest, cln_node_pb.CustomMsgNotification>;
}

export interface INodeClient {
    getinfo(request: cln_node_pb.GetinfoRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetinfoResponse) => void): grpc.ClientUnaryCall;
    getinfo(request: cln_node_pb.GetinfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetinfoResponse) => void): grpc.ClientUnaryCall;
    getinfo(request: cln_node_pb.GetinfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetinfoResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: cln_node_pb.ListpeersRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: cln_node_pb.ListpeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeersResponse) => void): grpc.ClientUnaryCall;
    listPeers(request: cln_node_pb.ListpeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeersResponse) => void): grpc.ClientUnaryCall;
    listFunds(request: cln_node_pb.ListfundsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListfundsResponse) => void): grpc.ClientUnaryCall;
    listFunds(request: cln_node_pb.ListfundsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListfundsResponse) => void): grpc.ClientUnaryCall;
    listFunds(request: cln_node_pb.ListfundsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListfundsResponse) => void): grpc.ClientUnaryCall;
    sendPay(request: cln_node_pb.SendpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpayResponse) => void): grpc.ClientUnaryCall;
    sendPay(request: cln_node_pb.SendpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpayResponse) => void): grpc.ClientUnaryCall;
    sendPay(request: cln_node_pb.SendpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpayResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: cln_node_pb.ListchannelsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListchannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: cln_node_pb.ListchannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListchannelsResponse) => void): grpc.ClientUnaryCall;
    listChannels(request: cln_node_pb.ListchannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListchannelsResponse) => void): grpc.ClientUnaryCall;
    addGossip(request: cln_node_pb.AddgossipRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddgossipResponse) => void): grpc.ClientUnaryCall;
    addGossip(request: cln_node_pb.AddgossipRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddgossipResponse) => void): grpc.ClientUnaryCall;
    addGossip(request: cln_node_pb.AddgossipRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddgossipResponse) => void): grpc.ClientUnaryCall;
    addPsbtOutput(request: cln_node_pb.AddpsbtoutputRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddpsbtoutputResponse) => void): grpc.ClientUnaryCall;
    addPsbtOutput(request: cln_node_pb.AddpsbtoutputRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddpsbtoutputResponse) => void): grpc.ClientUnaryCall;
    addPsbtOutput(request: cln_node_pb.AddpsbtoutputRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddpsbtoutputResponse) => void): grpc.ClientUnaryCall;
    autoCleanOnce(request: cln_node_pb.AutocleanonceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanonceResponse) => void): grpc.ClientUnaryCall;
    autoCleanOnce(request: cln_node_pb.AutocleanonceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanonceResponse) => void): grpc.ClientUnaryCall;
    autoCleanOnce(request: cln_node_pb.AutocleanonceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanonceResponse) => void): grpc.ClientUnaryCall;
    autoCleanStatus(request: cln_node_pb.AutocleanstatusRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanstatusResponse) => void): grpc.ClientUnaryCall;
    autoCleanStatus(request: cln_node_pb.AutocleanstatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanstatusResponse) => void): grpc.ClientUnaryCall;
    autoCleanStatus(request: cln_node_pb.AutocleanstatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanstatusResponse) => void): grpc.ClientUnaryCall;
    checkMessage(request: cln_node_pb.CheckmessageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckmessageResponse) => void): grpc.ClientUnaryCall;
    checkMessage(request: cln_node_pb.CheckmessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckmessageResponse) => void): grpc.ClientUnaryCall;
    checkMessage(request: cln_node_pb.CheckmessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckmessageResponse) => void): grpc.ClientUnaryCall;
    close(request: cln_node_pb.CloseRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CloseResponse) => void): grpc.ClientUnaryCall;
    close(request: cln_node_pb.CloseRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CloseResponse) => void): grpc.ClientUnaryCall;
    close(request: cln_node_pb.CloseRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CloseResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: cln_node_pb.ConnectRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ConnectResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: cln_node_pb.ConnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ConnectResponse) => void): grpc.ClientUnaryCall;
    connectPeer(request: cln_node_pb.ConnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ConnectResponse) => void): grpc.ClientUnaryCall;
    createInvoice(request: cln_node_pb.CreateinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateinvoiceResponse) => void): grpc.ClientUnaryCall;
    createInvoice(request: cln_node_pb.CreateinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateinvoiceResponse) => void): grpc.ClientUnaryCall;
    createInvoice(request: cln_node_pb.CreateinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateinvoiceResponse) => void): grpc.ClientUnaryCall;
    datastore(request: cln_node_pb.DatastoreRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreResponse) => void): grpc.ClientUnaryCall;
    datastore(request: cln_node_pb.DatastoreRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreResponse) => void): grpc.ClientUnaryCall;
    datastore(request: cln_node_pb.DatastoreRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreResponse) => void): grpc.ClientUnaryCall;
    datastoreUsage(request: cln_node_pb.DatastoreusageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreusageResponse) => void): grpc.ClientUnaryCall;
    datastoreUsage(request: cln_node_pb.DatastoreusageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreusageResponse) => void): grpc.ClientUnaryCall;
    datastoreUsage(request: cln_node_pb.DatastoreusageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreusageResponse) => void): grpc.ClientUnaryCall;
    createOnion(request: cln_node_pb.CreateonionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateonionResponse) => void): grpc.ClientUnaryCall;
    createOnion(request: cln_node_pb.CreateonionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateonionResponse) => void): grpc.ClientUnaryCall;
    createOnion(request: cln_node_pb.CreateonionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateonionResponse) => void): grpc.ClientUnaryCall;
    delDatastore(request: cln_node_pb.DeldatastoreRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DeldatastoreResponse) => void): grpc.ClientUnaryCall;
    delDatastore(request: cln_node_pb.DeldatastoreRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DeldatastoreResponse) => void): grpc.ClientUnaryCall;
    delDatastore(request: cln_node_pb.DeldatastoreRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DeldatastoreResponse) => void): grpc.ClientUnaryCall;
    delInvoice(request: cln_node_pb.DelinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelinvoiceResponse) => void): grpc.ClientUnaryCall;
    delInvoice(request: cln_node_pb.DelinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelinvoiceResponse) => void): grpc.ClientUnaryCall;
    delInvoice(request: cln_node_pb.DelinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelinvoiceResponse) => void): grpc.ClientUnaryCall;
    devForgetChannel(request: cln_node_pb.DevforgetchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevforgetchannelResponse) => void): grpc.ClientUnaryCall;
    devForgetChannel(request: cln_node_pb.DevforgetchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevforgetchannelResponse) => void): grpc.ClientUnaryCall;
    devForgetChannel(request: cln_node_pb.DevforgetchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevforgetchannelResponse) => void): grpc.ClientUnaryCall;
    emergencyRecover(request: cln_node_pb.EmergencyrecoverRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EmergencyrecoverResponse) => void): grpc.ClientUnaryCall;
    emergencyRecover(request: cln_node_pb.EmergencyrecoverRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EmergencyrecoverResponse) => void): grpc.ClientUnaryCall;
    emergencyRecover(request: cln_node_pb.EmergencyrecoverRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EmergencyrecoverResponse) => void): grpc.ClientUnaryCall;
    getEmergencyRecoverData(request: cln_node_pb.GetemergencyrecoverdataRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetemergencyrecoverdataResponse) => void): grpc.ClientUnaryCall;
    getEmergencyRecoverData(request: cln_node_pb.GetemergencyrecoverdataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetemergencyrecoverdataResponse) => void): grpc.ClientUnaryCall;
    getEmergencyRecoverData(request: cln_node_pb.GetemergencyrecoverdataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetemergencyrecoverdataResponse) => void): grpc.ClientUnaryCall;
    exposeSecret(request: cln_node_pb.ExposesecretRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ExposesecretResponse) => void): grpc.ClientUnaryCall;
    exposeSecret(request: cln_node_pb.ExposesecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ExposesecretResponse) => void): grpc.ClientUnaryCall;
    exposeSecret(request: cln_node_pb.ExposesecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ExposesecretResponse) => void): grpc.ClientUnaryCall;
    recover(request: cln_node_pb.RecoverRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverResponse) => void): grpc.ClientUnaryCall;
    recover(request: cln_node_pb.RecoverRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverResponse) => void): grpc.ClientUnaryCall;
    recover(request: cln_node_pb.RecoverRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverResponse) => void): grpc.ClientUnaryCall;
    recoverChannel(request: cln_node_pb.RecoverchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverchannelResponse) => void): grpc.ClientUnaryCall;
    recoverChannel(request: cln_node_pb.RecoverchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverchannelResponse) => void): grpc.ClientUnaryCall;
    recoverChannel(request: cln_node_pb.RecoverchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverchannelResponse) => void): grpc.ClientUnaryCall;
    invoice(request: cln_node_pb.InvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoiceResponse) => void): grpc.ClientUnaryCall;
    invoice(request: cln_node_pb.InvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoiceResponse) => void): grpc.ClientUnaryCall;
    invoice(request: cln_node_pb.InvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoiceResponse) => void): grpc.ClientUnaryCall;
    createInvoiceRequest(request: cln_node_pb.InvoicerequestRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoicerequestResponse) => void): grpc.ClientUnaryCall;
    createInvoiceRequest(request: cln_node_pb.InvoicerequestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoicerequestResponse) => void): grpc.ClientUnaryCall;
    createInvoiceRequest(request: cln_node_pb.InvoicerequestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoicerequestResponse) => void): grpc.ClientUnaryCall;
    disableInvoiceRequest(request: cln_node_pb.DisableinvoicerequestRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableinvoicerequestResponse) => void): grpc.ClientUnaryCall;
    disableInvoiceRequest(request: cln_node_pb.DisableinvoicerequestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableinvoicerequestResponse) => void): grpc.ClientUnaryCall;
    disableInvoiceRequest(request: cln_node_pb.DisableinvoicerequestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableinvoicerequestResponse) => void): grpc.ClientUnaryCall;
    listInvoiceRequests(request: cln_node_pb.ListinvoicerequestsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicerequestsResponse) => void): grpc.ClientUnaryCall;
    listInvoiceRequests(request: cln_node_pb.ListinvoicerequestsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicerequestsResponse) => void): grpc.ClientUnaryCall;
    listInvoiceRequests(request: cln_node_pb.ListinvoicerequestsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicerequestsResponse) => void): grpc.ClientUnaryCall;
    listDatastore(request: cln_node_pb.ListdatastoreRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListdatastoreResponse) => void): grpc.ClientUnaryCall;
    listDatastore(request: cln_node_pb.ListdatastoreRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListdatastoreResponse) => void): grpc.ClientUnaryCall;
    listDatastore(request: cln_node_pb.ListdatastoreRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListdatastoreResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: cln_node_pb.ListinvoicesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicesResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: cln_node_pb.ListinvoicesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicesResponse) => void): grpc.ClientUnaryCall;
    listInvoices(request: cln_node_pb.ListinvoicesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicesResponse) => void): grpc.ClientUnaryCall;
    sendOnion(request: cln_node_pb.SendonionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendonionResponse) => void): grpc.ClientUnaryCall;
    sendOnion(request: cln_node_pb.SendonionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendonionResponse) => void): grpc.ClientUnaryCall;
    sendOnion(request: cln_node_pb.SendonionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendonionResponse) => void): grpc.ClientUnaryCall;
    listSendPays(request: cln_node_pb.ListsendpaysRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListsendpaysResponse) => void): grpc.ClientUnaryCall;
    listSendPays(request: cln_node_pb.ListsendpaysRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListsendpaysResponse) => void): grpc.ClientUnaryCall;
    listSendPays(request: cln_node_pb.ListsendpaysRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListsendpaysResponse) => void): grpc.ClientUnaryCall;
    listTransactions(request: cln_node_pb.ListtransactionsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListtransactionsResponse) => void): grpc.ClientUnaryCall;
    listTransactions(request: cln_node_pb.ListtransactionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListtransactionsResponse) => void): grpc.ClientUnaryCall;
    listTransactions(request: cln_node_pb.ListtransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListtransactionsResponse) => void): grpc.ClientUnaryCall;
    makeSecret(request: cln_node_pb.MakesecretRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MakesecretResponse) => void): grpc.ClientUnaryCall;
    makeSecret(request: cln_node_pb.MakesecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MakesecretResponse) => void): grpc.ClientUnaryCall;
    makeSecret(request: cln_node_pb.MakesecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MakesecretResponse) => void): grpc.ClientUnaryCall;
    pay(request: cln_node_pb.PayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PayResponse) => void): grpc.ClientUnaryCall;
    pay(request: cln_node_pb.PayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PayResponse) => void): grpc.ClientUnaryCall;
    pay(request: cln_node_pb.PayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PayResponse) => void): grpc.ClientUnaryCall;
    listNodes(request: cln_node_pb.ListnodesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListnodesResponse) => void): grpc.ClientUnaryCall;
    listNodes(request: cln_node_pb.ListnodesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListnodesResponse) => void): grpc.ClientUnaryCall;
    listNodes(request: cln_node_pb.ListnodesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListnodesResponse) => void): grpc.ClientUnaryCall;
    waitAnyInvoice(request: cln_node_pb.WaitanyinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitanyinvoiceResponse) => void): grpc.ClientUnaryCall;
    waitAnyInvoice(request: cln_node_pb.WaitanyinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitanyinvoiceResponse) => void): grpc.ClientUnaryCall;
    waitAnyInvoice(request: cln_node_pb.WaitanyinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitanyinvoiceResponse) => void): grpc.ClientUnaryCall;
    waitInvoice(request: cln_node_pb.WaitinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitinvoiceResponse) => void): grpc.ClientUnaryCall;
    waitInvoice(request: cln_node_pb.WaitinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitinvoiceResponse) => void): grpc.ClientUnaryCall;
    waitInvoice(request: cln_node_pb.WaitinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitinvoiceResponse) => void): grpc.ClientUnaryCall;
    waitSendPay(request: cln_node_pb.WaitsendpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitsendpayResponse) => void): grpc.ClientUnaryCall;
    waitSendPay(request: cln_node_pb.WaitsendpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitsendpayResponse) => void): grpc.ClientUnaryCall;
    waitSendPay(request: cln_node_pb.WaitsendpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitsendpayResponse) => void): grpc.ClientUnaryCall;
    newAddr(request: cln_node_pb.NewaddrRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.NewaddrResponse) => void): grpc.ClientUnaryCall;
    newAddr(request: cln_node_pb.NewaddrRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.NewaddrResponse) => void): grpc.ClientUnaryCall;
    newAddr(request: cln_node_pb.NewaddrRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.NewaddrResponse) => void): grpc.ClientUnaryCall;
    withdraw(request: cln_node_pb.WithdrawRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WithdrawResponse) => void): grpc.ClientUnaryCall;
    withdraw(request: cln_node_pb.WithdrawRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WithdrawResponse) => void): grpc.ClientUnaryCall;
    withdraw(request: cln_node_pb.WithdrawRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WithdrawResponse) => void): grpc.ClientUnaryCall;
    keySend(request: cln_node_pb.KeysendRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.KeysendResponse) => void): grpc.ClientUnaryCall;
    keySend(request: cln_node_pb.KeysendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.KeysendResponse) => void): grpc.ClientUnaryCall;
    keySend(request: cln_node_pb.KeysendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.KeysendResponse) => void): grpc.ClientUnaryCall;
    fundPsbt(request: cln_node_pb.FundpsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundpsbtResponse) => void): grpc.ClientUnaryCall;
    fundPsbt(request: cln_node_pb.FundpsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundpsbtResponse) => void): grpc.ClientUnaryCall;
    fundPsbt(request: cln_node_pb.FundpsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundpsbtResponse) => void): grpc.ClientUnaryCall;
    sendPsbt(request: cln_node_pb.SendpsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpsbtResponse) => void): grpc.ClientUnaryCall;
    sendPsbt(request: cln_node_pb.SendpsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpsbtResponse) => void): grpc.ClientUnaryCall;
    sendPsbt(request: cln_node_pb.SendpsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpsbtResponse) => void): grpc.ClientUnaryCall;
    signPsbt(request: cln_node_pb.SignpsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignpsbtResponse) => void): grpc.ClientUnaryCall;
    signPsbt(request: cln_node_pb.SignpsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignpsbtResponse) => void): grpc.ClientUnaryCall;
    signPsbt(request: cln_node_pb.SignpsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignpsbtResponse) => void): grpc.ClientUnaryCall;
    utxoPsbt(request: cln_node_pb.UtxopsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UtxopsbtResponse) => void): grpc.ClientUnaryCall;
    utxoPsbt(request: cln_node_pb.UtxopsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UtxopsbtResponse) => void): grpc.ClientUnaryCall;
    utxoPsbt(request: cln_node_pb.UtxopsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UtxopsbtResponse) => void): grpc.ClientUnaryCall;
    txDiscard(request: cln_node_pb.TxdiscardRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxdiscardResponse) => void): grpc.ClientUnaryCall;
    txDiscard(request: cln_node_pb.TxdiscardRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxdiscardResponse) => void): grpc.ClientUnaryCall;
    txDiscard(request: cln_node_pb.TxdiscardRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxdiscardResponse) => void): grpc.ClientUnaryCall;
    txPrepare(request: cln_node_pb.TxprepareRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxprepareResponse) => void): grpc.ClientUnaryCall;
    txPrepare(request: cln_node_pb.TxprepareRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxprepareResponse) => void): grpc.ClientUnaryCall;
    txPrepare(request: cln_node_pb.TxprepareRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxprepareResponse) => void): grpc.ClientUnaryCall;
    txSend(request: cln_node_pb.TxsendRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxsendResponse) => void): grpc.ClientUnaryCall;
    txSend(request: cln_node_pb.TxsendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxsendResponse) => void): grpc.ClientUnaryCall;
    txSend(request: cln_node_pb.TxsendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxsendResponse) => void): grpc.ClientUnaryCall;
    listPeerChannels(request: cln_node_pb.ListpeerchannelsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeerchannelsResponse) => void): grpc.ClientUnaryCall;
    listPeerChannels(request: cln_node_pb.ListpeerchannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeerchannelsResponse) => void): grpc.ClientUnaryCall;
    listPeerChannels(request: cln_node_pb.ListpeerchannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeerchannelsResponse) => void): grpc.ClientUnaryCall;
    listClosedChannels(request: cln_node_pb.ListclosedchannelsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListclosedchannelsResponse) => void): grpc.ClientUnaryCall;
    listClosedChannels(request: cln_node_pb.ListclosedchannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListclosedchannelsResponse) => void): grpc.ClientUnaryCall;
    listClosedChannels(request: cln_node_pb.ListclosedchannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListclosedchannelsResponse) => void): grpc.ClientUnaryCall;
    decodePay(request: cln_node_pb.DecodepayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodepayResponse) => void): grpc.ClientUnaryCall;
    decodePay(request: cln_node_pb.DecodepayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodepayResponse) => void): grpc.ClientUnaryCall;
    decodePay(request: cln_node_pb.DecodepayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodepayResponse) => void): grpc.ClientUnaryCall;
    decode(request: cln_node_pb.DecodeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodeResponse) => void): grpc.ClientUnaryCall;
    decode(request: cln_node_pb.DecodeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodeResponse) => void): grpc.ClientUnaryCall;
    decode(request: cln_node_pb.DecodeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodeResponse) => void): grpc.ClientUnaryCall;
    delPay(request: cln_node_pb.DelpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelpayResponse) => void): grpc.ClientUnaryCall;
    delPay(request: cln_node_pb.DelpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelpayResponse) => void): grpc.ClientUnaryCall;
    delPay(request: cln_node_pb.DelpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelpayResponse) => void): grpc.ClientUnaryCall;
    delForward(request: cln_node_pb.DelforwardRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelforwardResponse) => void): grpc.ClientUnaryCall;
    delForward(request: cln_node_pb.DelforwardRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelforwardResponse) => void): grpc.ClientUnaryCall;
    delForward(request: cln_node_pb.DelforwardRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelforwardResponse) => void): grpc.ClientUnaryCall;
    disableOffer(request: cln_node_pb.DisableofferRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableofferResponse) => void): grpc.ClientUnaryCall;
    disableOffer(request: cln_node_pb.DisableofferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableofferResponse) => void): grpc.ClientUnaryCall;
    disableOffer(request: cln_node_pb.DisableofferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableofferResponse) => void): grpc.ClientUnaryCall;
    enableOffer(request: cln_node_pb.EnableofferRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EnableofferResponse) => void): grpc.ClientUnaryCall;
    enableOffer(request: cln_node_pb.EnableofferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EnableofferResponse) => void): grpc.ClientUnaryCall;
    enableOffer(request: cln_node_pb.EnableofferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EnableofferResponse) => void): grpc.ClientUnaryCall;
    disconnect(request: cln_node_pb.DisconnectRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisconnectResponse) => void): grpc.ClientUnaryCall;
    disconnect(request: cln_node_pb.DisconnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisconnectResponse) => void): grpc.ClientUnaryCall;
    disconnect(request: cln_node_pb.DisconnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisconnectResponse) => void): grpc.ClientUnaryCall;
    feerates(request: cln_node_pb.FeeratesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FeeratesResponse) => void): grpc.ClientUnaryCall;
    feerates(request: cln_node_pb.FeeratesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FeeratesResponse) => void): grpc.ClientUnaryCall;
    feerates(request: cln_node_pb.FeeratesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FeeratesResponse) => void): grpc.ClientUnaryCall;
    fetchInvoice(request: cln_node_pb.FetchinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FetchinvoiceResponse) => void): grpc.ClientUnaryCall;
    fetchInvoice(request: cln_node_pb.FetchinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FetchinvoiceResponse) => void): grpc.ClientUnaryCall;
    fetchInvoice(request: cln_node_pb.FetchinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FetchinvoiceResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Cancel(request: cln_node_pb.Fundchannel_cancelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_cancelResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Cancel(request: cln_node_pb.Fundchannel_cancelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_cancelResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Cancel(request: cln_node_pb.Fundchannel_cancelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_cancelResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Complete(request: cln_node_pb.Fundchannel_completeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_completeResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Complete(request: cln_node_pb.Fundchannel_completeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_completeResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Complete(request: cln_node_pb.Fundchannel_completeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_completeResponse) => void): grpc.ClientUnaryCall;
    fundChannel(request: cln_node_pb.FundchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundchannelResponse) => void): grpc.ClientUnaryCall;
    fundChannel(request: cln_node_pb.FundchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundchannelResponse) => void): grpc.ClientUnaryCall;
    fundChannel(request: cln_node_pb.FundchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundchannelResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Start(request: cln_node_pb.Fundchannel_startRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_startResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Start(request: cln_node_pb.Fundchannel_startRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_startResponse) => void): grpc.ClientUnaryCall;
    fundChannel_Start(request: cln_node_pb.Fundchannel_startRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_startResponse) => void): grpc.ClientUnaryCall;
    getLog(request: cln_node_pb.GetlogRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetlogResponse) => void): grpc.ClientUnaryCall;
    getLog(request: cln_node_pb.GetlogRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetlogResponse) => void): grpc.ClientUnaryCall;
    getLog(request: cln_node_pb.GetlogRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetlogResponse) => void): grpc.ClientUnaryCall;
    funderUpdate(request: cln_node_pb.FunderupdateRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FunderupdateResponse) => void): grpc.ClientUnaryCall;
    funderUpdate(request: cln_node_pb.FunderupdateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FunderupdateResponse) => void): grpc.ClientUnaryCall;
    funderUpdate(request: cln_node_pb.FunderupdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FunderupdateResponse) => void): grpc.ClientUnaryCall;
    getRoute(request: cln_node_pb.GetrouteRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetrouteResponse) => void): grpc.ClientUnaryCall;
    getRoute(request: cln_node_pb.GetrouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetrouteResponse) => void): grpc.ClientUnaryCall;
    getRoute(request: cln_node_pb.GetrouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetrouteResponse) => void): grpc.ClientUnaryCall;
    listAddresses(request: cln_node_pb.ListaddressesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListaddressesResponse) => void): grpc.ClientUnaryCall;
    listAddresses(request: cln_node_pb.ListaddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListaddressesResponse) => void): grpc.ClientUnaryCall;
    listAddresses(request: cln_node_pb.ListaddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListaddressesResponse) => void): grpc.ClientUnaryCall;
    listForwards(request: cln_node_pb.ListforwardsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListforwardsResponse) => void): grpc.ClientUnaryCall;
    listForwards(request: cln_node_pb.ListforwardsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListforwardsResponse) => void): grpc.ClientUnaryCall;
    listForwards(request: cln_node_pb.ListforwardsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListforwardsResponse) => void): grpc.ClientUnaryCall;
    listOffers(request: cln_node_pb.ListoffersRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListoffersResponse) => void): grpc.ClientUnaryCall;
    listOffers(request: cln_node_pb.ListoffersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListoffersResponse) => void): grpc.ClientUnaryCall;
    listOffers(request: cln_node_pb.ListoffersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListoffersResponse) => void): grpc.ClientUnaryCall;
    listPays(request: cln_node_pb.ListpaysRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpaysResponse) => void): grpc.ClientUnaryCall;
    listPays(request: cln_node_pb.ListpaysRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpaysResponse) => void): grpc.ClientUnaryCall;
    listPays(request: cln_node_pb.ListpaysRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpaysResponse) => void): grpc.ClientUnaryCall;
    listHtlcs(request: cln_node_pb.ListhtlcsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListhtlcsResponse) => void): grpc.ClientUnaryCall;
    listHtlcs(request: cln_node_pb.ListhtlcsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListhtlcsResponse) => void): grpc.ClientUnaryCall;
    listHtlcs(request: cln_node_pb.ListhtlcsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListhtlcsResponse) => void): grpc.ClientUnaryCall;
    multiFundChannel(request: cln_node_pb.MultifundchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultifundchannelResponse) => void): grpc.ClientUnaryCall;
    multiFundChannel(request: cln_node_pb.MultifundchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultifundchannelResponse) => void): grpc.ClientUnaryCall;
    multiFundChannel(request: cln_node_pb.MultifundchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultifundchannelResponse) => void): grpc.ClientUnaryCall;
    multiWithdraw(request: cln_node_pb.MultiwithdrawRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultiwithdrawResponse) => void): grpc.ClientUnaryCall;
    multiWithdraw(request: cln_node_pb.MultiwithdrawRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultiwithdrawResponse) => void): grpc.ClientUnaryCall;
    multiWithdraw(request: cln_node_pb.MultiwithdrawRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultiwithdrawResponse) => void): grpc.ClientUnaryCall;
    offer(request: cln_node_pb.OfferRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.OfferResponse) => void): grpc.ClientUnaryCall;
    offer(request: cln_node_pb.OfferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.OfferResponse) => void): grpc.ClientUnaryCall;
    offer(request: cln_node_pb.OfferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.OfferResponse) => void): grpc.ClientUnaryCall;
    openChannel_Abort(request: cln_node_pb.Openchannel_abortRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_abortResponse) => void): grpc.ClientUnaryCall;
    openChannel_Abort(request: cln_node_pb.Openchannel_abortRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_abortResponse) => void): grpc.ClientUnaryCall;
    openChannel_Abort(request: cln_node_pb.Openchannel_abortRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_abortResponse) => void): grpc.ClientUnaryCall;
    openChannel_Bump(request: cln_node_pb.Openchannel_bumpRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_bumpResponse) => void): grpc.ClientUnaryCall;
    openChannel_Bump(request: cln_node_pb.Openchannel_bumpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_bumpResponse) => void): grpc.ClientUnaryCall;
    openChannel_Bump(request: cln_node_pb.Openchannel_bumpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_bumpResponse) => void): grpc.ClientUnaryCall;
    openChannel_Init(request: cln_node_pb.Openchannel_initRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_initResponse) => void): grpc.ClientUnaryCall;
    openChannel_Init(request: cln_node_pb.Openchannel_initRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_initResponse) => void): grpc.ClientUnaryCall;
    openChannel_Init(request: cln_node_pb.Openchannel_initRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_initResponse) => void): grpc.ClientUnaryCall;
    openChannel_Signed(request: cln_node_pb.Openchannel_signedRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_signedResponse) => void): grpc.ClientUnaryCall;
    openChannel_Signed(request: cln_node_pb.Openchannel_signedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_signedResponse) => void): grpc.ClientUnaryCall;
    openChannel_Signed(request: cln_node_pb.Openchannel_signedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_signedResponse) => void): grpc.ClientUnaryCall;
    openChannel_Update(request: cln_node_pb.Openchannel_updateRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_updateResponse) => void): grpc.ClientUnaryCall;
    openChannel_Update(request: cln_node_pb.Openchannel_updateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_updateResponse) => void): grpc.ClientUnaryCall;
    openChannel_Update(request: cln_node_pb.Openchannel_updateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_updateResponse) => void): grpc.ClientUnaryCall;
    ping(request: cln_node_pb.PingRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PingResponse) => void): grpc.ClientUnaryCall;
    ping(request: cln_node_pb.PingRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PingResponse) => void): grpc.ClientUnaryCall;
    ping(request: cln_node_pb.PingRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PingResponse) => void): grpc.ClientUnaryCall;
    plugin(request: cln_node_pb.PluginRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PluginResponse) => void): grpc.ClientUnaryCall;
    plugin(request: cln_node_pb.PluginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PluginResponse) => void): grpc.ClientUnaryCall;
    plugin(request: cln_node_pb.PluginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PluginResponse) => void): grpc.ClientUnaryCall;
    renePayStatus(request: cln_node_pb.RenepaystatusRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepaystatusResponse) => void): grpc.ClientUnaryCall;
    renePayStatus(request: cln_node_pb.RenepaystatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepaystatusResponse) => void): grpc.ClientUnaryCall;
    renePayStatus(request: cln_node_pb.RenepaystatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepaystatusResponse) => void): grpc.ClientUnaryCall;
    renePay(request: cln_node_pb.RenepayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepayResponse) => void): grpc.ClientUnaryCall;
    renePay(request: cln_node_pb.RenepayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepayResponse) => void): grpc.ClientUnaryCall;
    renePay(request: cln_node_pb.RenepayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepayResponse) => void): grpc.ClientUnaryCall;
    reserveInputs(request: cln_node_pb.ReserveinputsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ReserveinputsResponse) => void): grpc.ClientUnaryCall;
    reserveInputs(request: cln_node_pb.ReserveinputsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ReserveinputsResponse) => void): grpc.ClientUnaryCall;
    reserveInputs(request: cln_node_pb.ReserveinputsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ReserveinputsResponse) => void): grpc.ClientUnaryCall;
    sendCustomMsg(request: cln_node_pb.SendcustommsgRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendcustommsgResponse) => void): grpc.ClientUnaryCall;
    sendCustomMsg(request: cln_node_pb.SendcustommsgRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendcustommsgResponse) => void): grpc.ClientUnaryCall;
    sendCustomMsg(request: cln_node_pb.SendcustommsgRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendcustommsgResponse) => void): grpc.ClientUnaryCall;
    sendInvoice(request: cln_node_pb.SendinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendinvoiceResponse) => void): grpc.ClientUnaryCall;
    sendInvoice(request: cln_node_pb.SendinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendinvoiceResponse) => void): grpc.ClientUnaryCall;
    sendInvoice(request: cln_node_pb.SendinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendinvoiceResponse) => void): grpc.ClientUnaryCall;
    setChannel(request: cln_node_pb.SetchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetchannelResponse) => void): grpc.ClientUnaryCall;
    setChannel(request: cln_node_pb.SetchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetchannelResponse) => void): grpc.ClientUnaryCall;
    setChannel(request: cln_node_pb.SetchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetchannelResponse) => void): grpc.ClientUnaryCall;
    setConfig(request: cln_node_pb.SetconfigRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetconfigResponse) => void): grpc.ClientUnaryCall;
    setConfig(request: cln_node_pb.SetconfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetconfigResponse) => void): grpc.ClientUnaryCall;
    setConfig(request: cln_node_pb.SetconfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetconfigResponse) => void): grpc.ClientUnaryCall;
    setPsbtVersion(request: cln_node_pb.SetpsbtversionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetpsbtversionResponse) => void): grpc.ClientUnaryCall;
    setPsbtVersion(request: cln_node_pb.SetpsbtversionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetpsbtversionResponse) => void): grpc.ClientUnaryCall;
    setPsbtVersion(request: cln_node_pb.SetpsbtversionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetpsbtversionResponse) => void): grpc.ClientUnaryCall;
    signInvoice(request: cln_node_pb.SigninvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SigninvoiceResponse) => void): grpc.ClientUnaryCall;
    signInvoice(request: cln_node_pb.SigninvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SigninvoiceResponse) => void): grpc.ClientUnaryCall;
    signInvoice(request: cln_node_pb.SigninvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SigninvoiceResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: cln_node_pb.SignmessageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignmessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: cln_node_pb.SignmessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignmessageResponse) => void): grpc.ClientUnaryCall;
    signMessage(request: cln_node_pb.SignmessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignmessageResponse) => void): grpc.ClientUnaryCall;
    splice_Init(request: cln_node_pb.Splice_initRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_initResponse) => void): grpc.ClientUnaryCall;
    splice_Init(request: cln_node_pb.Splice_initRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_initResponse) => void): grpc.ClientUnaryCall;
    splice_Init(request: cln_node_pb.Splice_initRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_initResponse) => void): grpc.ClientUnaryCall;
    splice_Signed(request: cln_node_pb.Splice_signedRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_signedResponse) => void): grpc.ClientUnaryCall;
    splice_Signed(request: cln_node_pb.Splice_signedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_signedResponse) => void): grpc.ClientUnaryCall;
    splice_Signed(request: cln_node_pb.Splice_signedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_signedResponse) => void): grpc.ClientUnaryCall;
    splice_Update(request: cln_node_pb.Splice_updateRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_updateResponse) => void): grpc.ClientUnaryCall;
    splice_Update(request: cln_node_pb.Splice_updateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_updateResponse) => void): grpc.ClientUnaryCall;
    splice_Update(request: cln_node_pb.Splice_updateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_updateResponse) => void): grpc.ClientUnaryCall;
    devSplice(request: cln_node_pb.DevspliceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevspliceResponse) => void): grpc.ClientUnaryCall;
    devSplice(request: cln_node_pb.DevspliceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevspliceResponse) => void): grpc.ClientUnaryCall;
    devSplice(request: cln_node_pb.DevspliceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevspliceResponse) => void): grpc.ClientUnaryCall;
    unreserveInputs(request: cln_node_pb.UnreserveinputsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UnreserveinputsResponse) => void): grpc.ClientUnaryCall;
    unreserveInputs(request: cln_node_pb.UnreserveinputsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UnreserveinputsResponse) => void): grpc.ClientUnaryCall;
    unreserveInputs(request: cln_node_pb.UnreserveinputsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UnreserveinputsResponse) => void): grpc.ClientUnaryCall;
    upgradeWallet(request: cln_node_pb.UpgradewalletRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UpgradewalletResponse) => void): grpc.ClientUnaryCall;
    upgradeWallet(request: cln_node_pb.UpgradewalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UpgradewalletResponse) => void): grpc.ClientUnaryCall;
    upgradeWallet(request: cln_node_pb.UpgradewalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UpgradewalletResponse) => void): grpc.ClientUnaryCall;
    waitBlockHeight(request: cln_node_pb.WaitblockheightRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitblockheightResponse) => void): grpc.ClientUnaryCall;
    waitBlockHeight(request: cln_node_pb.WaitblockheightRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitblockheightResponse) => void): grpc.ClientUnaryCall;
    waitBlockHeight(request: cln_node_pb.WaitblockheightRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitblockheightResponse) => void): grpc.ClientUnaryCall;
    wait(request: cln_node_pb.WaitRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitResponse) => void): grpc.ClientUnaryCall;
    wait(request: cln_node_pb.WaitRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitResponse) => void): grpc.ClientUnaryCall;
    wait(request: cln_node_pb.WaitRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitResponse) => void): grpc.ClientUnaryCall;
    listConfigs(request: cln_node_pb.ListconfigsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListconfigsResponse) => void): grpc.ClientUnaryCall;
    listConfigs(request: cln_node_pb.ListconfigsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListconfigsResponse) => void): grpc.ClientUnaryCall;
    listConfigs(request: cln_node_pb.ListconfigsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListconfigsResponse) => void): grpc.ClientUnaryCall;
    stop(request: cln_node_pb.StopRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stop(request: cln_node_pb.StopRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StopResponse) => void): grpc.ClientUnaryCall;
    stop(request: cln_node_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StopResponse) => void): grpc.ClientUnaryCall;
    help(request: cln_node_pb.HelpRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.HelpResponse) => void): grpc.ClientUnaryCall;
    help(request: cln_node_pb.HelpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.HelpResponse) => void): grpc.ClientUnaryCall;
    help(request: cln_node_pb.HelpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.HelpResponse) => void): grpc.ClientUnaryCall;
    preApproveKeysend(request: cln_node_pb.PreapprovekeysendRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapprovekeysendResponse) => void): grpc.ClientUnaryCall;
    preApproveKeysend(request: cln_node_pb.PreapprovekeysendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapprovekeysendResponse) => void): grpc.ClientUnaryCall;
    preApproveKeysend(request: cln_node_pb.PreapprovekeysendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapprovekeysendResponse) => void): grpc.ClientUnaryCall;
    preApproveInvoice(request: cln_node_pb.PreapproveinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapproveinvoiceResponse) => void): grpc.ClientUnaryCall;
    preApproveInvoice(request: cln_node_pb.PreapproveinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapproveinvoiceResponse) => void): grpc.ClientUnaryCall;
    preApproveInvoice(request: cln_node_pb.PreapproveinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapproveinvoiceResponse) => void): grpc.ClientUnaryCall;
    staticBackup(request: cln_node_pb.StaticbackupRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StaticbackupResponse) => void): grpc.ClientUnaryCall;
    staticBackup(request: cln_node_pb.StaticbackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StaticbackupResponse) => void): grpc.ClientUnaryCall;
    staticBackup(request: cln_node_pb.StaticbackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StaticbackupResponse) => void): grpc.ClientUnaryCall;
    bkprChannelsApy(request: cln_node_pb.BkprchannelsapyRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprchannelsapyResponse) => void): grpc.ClientUnaryCall;
    bkprChannelsApy(request: cln_node_pb.BkprchannelsapyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprchannelsapyResponse) => void): grpc.ClientUnaryCall;
    bkprChannelsApy(request: cln_node_pb.BkprchannelsapyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprchannelsapyResponse) => void): grpc.ClientUnaryCall;
    bkprDumpIncomeCsv(request: cln_node_pb.BkprdumpincomecsvRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprdumpincomecsvResponse) => void): grpc.ClientUnaryCall;
    bkprDumpIncomeCsv(request: cln_node_pb.BkprdumpincomecsvRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprdumpincomecsvResponse) => void): grpc.ClientUnaryCall;
    bkprDumpIncomeCsv(request: cln_node_pb.BkprdumpincomecsvRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprdumpincomecsvResponse) => void): grpc.ClientUnaryCall;
    bkprInspect(request: cln_node_pb.BkprinspectRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprinspectResponse) => void): grpc.ClientUnaryCall;
    bkprInspect(request: cln_node_pb.BkprinspectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprinspectResponse) => void): grpc.ClientUnaryCall;
    bkprInspect(request: cln_node_pb.BkprinspectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprinspectResponse) => void): grpc.ClientUnaryCall;
    bkprListAccountEvents(request: cln_node_pb.BkprlistaccounteventsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistaccounteventsResponse) => void): grpc.ClientUnaryCall;
    bkprListAccountEvents(request: cln_node_pb.BkprlistaccounteventsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistaccounteventsResponse) => void): grpc.ClientUnaryCall;
    bkprListAccountEvents(request: cln_node_pb.BkprlistaccounteventsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistaccounteventsResponse) => void): grpc.ClientUnaryCall;
    bkprListBalances(request: cln_node_pb.BkprlistbalancesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistbalancesResponse) => void): grpc.ClientUnaryCall;
    bkprListBalances(request: cln_node_pb.BkprlistbalancesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistbalancesResponse) => void): grpc.ClientUnaryCall;
    bkprListBalances(request: cln_node_pb.BkprlistbalancesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistbalancesResponse) => void): grpc.ClientUnaryCall;
    bkprListIncome(request: cln_node_pb.BkprlistincomeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistincomeResponse) => void): grpc.ClientUnaryCall;
    bkprListIncome(request: cln_node_pb.BkprlistincomeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistincomeResponse) => void): grpc.ClientUnaryCall;
    bkprListIncome(request: cln_node_pb.BkprlistincomeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistincomeResponse) => void): grpc.ClientUnaryCall;
    bkprEditDescriptionByPaymentId(request: cln_node_pb.BkpreditdescriptionbypaymentidRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbypaymentidResponse) => void): grpc.ClientUnaryCall;
    bkprEditDescriptionByPaymentId(request: cln_node_pb.BkpreditdescriptionbypaymentidRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbypaymentidResponse) => void): grpc.ClientUnaryCall;
    bkprEditDescriptionByPaymentId(request: cln_node_pb.BkpreditdescriptionbypaymentidRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbypaymentidResponse) => void): grpc.ClientUnaryCall;
    bkprEditDescriptionByOutpoint(request: cln_node_pb.BkpreditdescriptionbyoutpointRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbyoutpointResponse) => void): grpc.ClientUnaryCall;
    bkprEditDescriptionByOutpoint(request: cln_node_pb.BkpreditdescriptionbyoutpointRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbyoutpointResponse) => void): grpc.ClientUnaryCall;
    bkprEditDescriptionByOutpoint(request: cln_node_pb.BkpreditdescriptionbyoutpointRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbyoutpointResponse) => void): grpc.ClientUnaryCall;
    blacklistRune(request: cln_node_pb.BlacklistruneRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BlacklistruneResponse) => void): grpc.ClientUnaryCall;
    blacklistRune(request: cln_node_pb.BlacklistruneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BlacklistruneResponse) => void): grpc.ClientUnaryCall;
    blacklistRune(request: cln_node_pb.BlacklistruneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BlacklistruneResponse) => void): grpc.ClientUnaryCall;
    checkRune(request: cln_node_pb.CheckruneRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckruneResponse) => void): grpc.ClientUnaryCall;
    checkRune(request: cln_node_pb.CheckruneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckruneResponse) => void): grpc.ClientUnaryCall;
    checkRune(request: cln_node_pb.CheckruneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckruneResponse) => void): grpc.ClientUnaryCall;
    createRune(request: cln_node_pb.CreateruneRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateruneResponse) => void): grpc.ClientUnaryCall;
    createRune(request: cln_node_pb.CreateruneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateruneResponse) => void): grpc.ClientUnaryCall;
    createRune(request: cln_node_pb.CreateruneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateruneResponse) => void): grpc.ClientUnaryCall;
    showRunes(request: cln_node_pb.ShowrunesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ShowrunesResponse) => void): grpc.ClientUnaryCall;
    showRunes(request: cln_node_pb.ShowrunesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ShowrunesResponse) => void): grpc.ClientUnaryCall;
    showRunes(request: cln_node_pb.ShowrunesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ShowrunesResponse) => void): grpc.ClientUnaryCall;
    askReneUnreserve(request: cln_node_pb.AskreneunreserveRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneunreserveResponse) => void): grpc.ClientUnaryCall;
    askReneUnreserve(request: cln_node_pb.AskreneunreserveRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneunreserveResponse) => void): grpc.ClientUnaryCall;
    askReneUnreserve(request: cln_node_pb.AskreneunreserveRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneunreserveResponse) => void): grpc.ClientUnaryCall;
    askReneListLayers(request: cln_node_pb.AskrenelistlayersRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistlayersResponse) => void): grpc.ClientUnaryCall;
    askReneListLayers(request: cln_node_pb.AskrenelistlayersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistlayersResponse) => void): grpc.ClientUnaryCall;
    askReneListLayers(request: cln_node_pb.AskrenelistlayersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistlayersResponse) => void): grpc.ClientUnaryCall;
    askReneCreateLayer(request: cln_node_pb.AskrenecreatelayerRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatelayerResponse) => void): grpc.ClientUnaryCall;
    askReneCreateLayer(request: cln_node_pb.AskrenecreatelayerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatelayerResponse) => void): grpc.ClientUnaryCall;
    askReneCreateLayer(request: cln_node_pb.AskrenecreatelayerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatelayerResponse) => void): grpc.ClientUnaryCall;
    askReneRemoveLayer(request: cln_node_pb.AskreneremovelayerRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneremovelayerResponse) => void): grpc.ClientUnaryCall;
    askReneRemoveLayer(request: cln_node_pb.AskreneremovelayerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneremovelayerResponse) => void): grpc.ClientUnaryCall;
    askReneRemoveLayer(request: cln_node_pb.AskreneremovelayerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneremovelayerResponse) => void): grpc.ClientUnaryCall;
    askReneReserve(request: cln_node_pb.AskrenereserveRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenereserveResponse) => void): grpc.ClientUnaryCall;
    askReneReserve(request: cln_node_pb.AskrenereserveRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenereserveResponse) => void): grpc.ClientUnaryCall;
    askReneReserve(request: cln_node_pb.AskrenereserveRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenereserveResponse) => void): grpc.ClientUnaryCall;
    askReneAge(request: cln_node_pb.AskreneageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneageResponse) => void): grpc.ClientUnaryCall;
    askReneAge(request: cln_node_pb.AskreneageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneageResponse) => void): grpc.ClientUnaryCall;
    askReneAge(request: cln_node_pb.AskreneageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneageResponse) => void): grpc.ClientUnaryCall;
    getRoutes(request: cln_node_pb.GetroutesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetroutesResponse) => void): grpc.ClientUnaryCall;
    getRoutes(request: cln_node_pb.GetroutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetroutesResponse) => void): grpc.ClientUnaryCall;
    getRoutes(request: cln_node_pb.GetroutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetroutesResponse) => void): grpc.ClientUnaryCall;
    askReneDisableNode(request: cln_node_pb.AskrenedisablenodeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenedisablenodeResponse) => void): grpc.ClientUnaryCall;
    askReneDisableNode(request: cln_node_pb.AskrenedisablenodeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenedisablenodeResponse) => void): grpc.ClientUnaryCall;
    askReneDisableNode(request: cln_node_pb.AskrenedisablenodeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenedisablenodeResponse) => void): grpc.ClientUnaryCall;
    askReneInformChannel(request: cln_node_pb.AskreneinformchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneinformchannelResponse) => void): grpc.ClientUnaryCall;
    askReneInformChannel(request: cln_node_pb.AskreneinformchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneinformchannelResponse) => void): grpc.ClientUnaryCall;
    askReneInformChannel(request: cln_node_pb.AskreneinformchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneinformchannelResponse) => void): grpc.ClientUnaryCall;
    askReneCreateChannel(request: cln_node_pb.AskrenecreatechannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatechannelResponse) => void): grpc.ClientUnaryCall;
    askReneCreateChannel(request: cln_node_pb.AskrenecreatechannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatechannelResponse) => void): grpc.ClientUnaryCall;
    askReneCreateChannel(request: cln_node_pb.AskrenecreatechannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatechannelResponse) => void): grpc.ClientUnaryCall;
    askReneUpdateChannel(request: cln_node_pb.AskreneupdatechannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneupdatechannelResponse) => void): grpc.ClientUnaryCall;
    askReneUpdateChannel(request: cln_node_pb.AskreneupdatechannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneupdatechannelResponse) => void): grpc.ClientUnaryCall;
    askReneUpdateChannel(request: cln_node_pb.AskreneupdatechannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneupdatechannelResponse) => void): grpc.ClientUnaryCall;
    askReneBiasChannel(request: cln_node_pb.AskrenebiaschannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenebiaschannelResponse) => void): grpc.ClientUnaryCall;
    askReneBiasChannel(request: cln_node_pb.AskrenebiaschannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenebiaschannelResponse) => void): grpc.ClientUnaryCall;
    askReneBiasChannel(request: cln_node_pb.AskrenebiaschannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenebiaschannelResponse) => void): grpc.ClientUnaryCall;
    askReneListReservations(request: cln_node_pb.AskrenelistreservationsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistreservationsResponse) => void): grpc.ClientUnaryCall;
    askReneListReservations(request: cln_node_pb.AskrenelistreservationsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistreservationsResponse) => void): grpc.ClientUnaryCall;
    askReneListReservations(request: cln_node_pb.AskrenelistreservationsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistreservationsResponse) => void): grpc.ClientUnaryCall;
    injectPaymentOnion(request: cln_node_pb.InjectpaymentonionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InjectpaymentonionResponse) => void): grpc.ClientUnaryCall;
    injectPaymentOnion(request: cln_node_pb.InjectpaymentonionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InjectpaymentonionResponse) => void): grpc.ClientUnaryCall;
    injectPaymentOnion(request: cln_node_pb.InjectpaymentonionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InjectpaymentonionResponse) => void): grpc.ClientUnaryCall;
    xpay(request: cln_node_pb.XpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.XpayResponse) => void): grpc.ClientUnaryCall;
    xpay(request: cln_node_pb.XpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.XpayResponse) => void): grpc.ClientUnaryCall;
    xpay(request: cln_node_pb.XpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.XpayResponse) => void): grpc.ClientUnaryCall;
    subscribeBlockAdded(request: cln_node_pb.StreamBlockAddedRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.BlockAddedNotification>;
    subscribeBlockAdded(request: cln_node_pb.StreamBlockAddedRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.BlockAddedNotification>;
    subscribeChannelOpenFailed(request: cln_node_pb.StreamChannelOpenFailedRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenFailedNotification>;
    subscribeChannelOpenFailed(request: cln_node_pb.StreamChannelOpenFailedRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenFailedNotification>;
    subscribeChannelOpened(request: cln_node_pb.StreamChannelOpenedRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenedNotification>;
    subscribeChannelOpened(request: cln_node_pb.StreamChannelOpenedRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenedNotification>;
    subscribeConnect(request: cln_node_pb.StreamConnectRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.PeerConnectNotification>;
    subscribeConnect(request: cln_node_pb.StreamConnectRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.PeerConnectNotification>;
    subscribeCustomMsg(request: cln_node_pb.StreamCustomMsgRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.CustomMsgNotification>;
    subscribeCustomMsg(request: cln_node_pb.StreamCustomMsgRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.CustomMsgNotification>;
}

export class NodeClient extends grpc.Client implements INodeClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getinfo(request: cln_node_pb.GetinfoRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetinfoResponse) => void): grpc.ClientUnaryCall;
    public getinfo(request: cln_node_pb.GetinfoRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetinfoResponse) => void): grpc.ClientUnaryCall;
    public getinfo(request: cln_node_pb.GetinfoRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetinfoResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: cln_node_pb.ListpeersRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: cln_node_pb.ListpeersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeersResponse) => void): grpc.ClientUnaryCall;
    public listPeers(request: cln_node_pb.ListpeersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeersResponse) => void): grpc.ClientUnaryCall;
    public listFunds(request: cln_node_pb.ListfundsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListfundsResponse) => void): grpc.ClientUnaryCall;
    public listFunds(request: cln_node_pb.ListfundsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListfundsResponse) => void): grpc.ClientUnaryCall;
    public listFunds(request: cln_node_pb.ListfundsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListfundsResponse) => void): grpc.ClientUnaryCall;
    public sendPay(request: cln_node_pb.SendpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpayResponse) => void): grpc.ClientUnaryCall;
    public sendPay(request: cln_node_pb.SendpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpayResponse) => void): grpc.ClientUnaryCall;
    public sendPay(request: cln_node_pb.SendpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpayResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: cln_node_pb.ListchannelsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListchannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: cln_node_pb.ListchannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListchannelsResponse) => void): grpc.ClientUnaryCall;
    public listChannels(request: cln_node_pb.ListchannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListchannelsResponse) => void): grpc.ClientUnaryCall;
    public addGossip(request: cln_node_pb.AddgossipRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddgossipResponse) => void): grpc.ClientUnaryCall;
    public addGossip(request: cln_node_pb.AddgossipRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddgossipResponse) => void): grpc.ClientUnaryCall;
    public addGossip(request: cln_node_pb.AddgossipRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddgossipResponse) => void): grpc.ClientUnaryCall;
    public addPsbtOutput(request: cln_node_pb.AddpsbtoutputRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddpsbtoutputResponse) => void): grpc.ClientUnaryCall;
    public addPsbtOutput(request: cln_node_pb.AddpsbtoutputRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddpsbtoutputResponse) => void): grpc.ClientUnaryCall;
    public addPsbtOutput(request: cln_node_pb.AddpsbtoutputRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AddpsbtoutputResponse) => void): grpc.ClientUnaryCall;
    public autoCleanOnce(request: cln_node_pb.AutocleanonceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanonceResponse) => void): grpc.ClientUnaryCall;
    public autoCleanOnce(request: cln_node_pb.AutocleanonceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanonceResponse) => void): grpc.ClientUnaryCall;
    public autoCleanOnce(request: cln_node_pb.AutocleanonceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanonceResponse) => void): grpc.ClientUnaryCall;
    public autoCleanStatus(request: cln_node_pb.AutocleanstatusRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanstatusResponse) => void): grpc.ClientUnaryCall;
    public autoCleanStatus(request: cln_node_pb.AutocleanstatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanstatusResponse) => void): grpc.ClientUnaryCall;
    public autoCleanStatus(request: cln_node_pb.AutocleanstatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AutocleanstatusResponse) => void): grpc.ClientUnaryCall;
    public checkMessage(request: cln_node_pb.CheckmessageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckmessageResponse) => void): grpc.ClientUnaryCall;
    public checkMessage(request: cln_node_pb.CheckmessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckmessageResponse) => void): grpc.ClientUnaryCall;
    public checkMessage(request: cln_node_pb.CheckmessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckmessageResponse) => void): grpc.ClientUnaryCall;
    public close(request: cln_node_pb.CloseRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CloseResponse) => void): grpc.ClientUnaryCall;
    public close(request: cln_node_pb.CloseRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CloseResponse) => void): grpc.ClientUnaryCall;
    public close(request: cln_node_pb.CloseRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CloseResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: cln_node_pb.ConnectRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ConnectResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: cln_node_pb.ConnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ConnectResponse) => void): grpc.ClientUnaryCall;
    public connectPeer(request: cln_node_pb.ConnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ConnectResponse) => void): grpc.ClientUnaryCall;
    public createInvoice(request: cln_node_pb.CreateinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateinvoiceResponse) => void): grpc.ClientUnaryCall;
    public createInvoice(request: cln_node_pb.CreateinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateinvoiceResponse) => void): grpc.ClientUnaryCall;
    public createInvoice(request: cln_node_pb.CreateinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateinvoiceResponse) => void): grpc.ClientUnaryCall;
    public datastore(request: cln_node_pb.DatastoreRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreResponse) => void): grpc.ClientUnaryCall;
    public datastore(request: cln_node_pb.DatastoreRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreResponse) => void): grpc.ClientUnaryCall;
    public datastore(request: cln_node_pb.DatastoreRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreResponse) => void): grpc.ClientUnaryCall;
    public datastoreUsage(request: cln_node_pb.DatastoreusageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreusageResponse) => void): grpc.ClientUnaryCall;
    public datastoreUsage(request: cln_node_pb.DatastoreusageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreusageResponse) => void): grpc.ClientUnaryCall;
    public datastoreUsage(request: cln_node_pb.DatastoreusageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DatastoreusageResponse) => void): grpc.ClientUnaryCall;
    public createOnion(request: cln_node_pb.CreateonionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateonionResponse) => void): grpc.ClientUnaryCall;
    public createOnion(request: cln_node_pb.CreateonionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateonionResponse) => void): grpc.ClientUnaryCall;
    public createOnion(request: cln_node_pb.CreateonionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateonionResponse) => void): grpc.ClientUnaryCall;
    public delDatastore(request: cln_node_pb.DeldatastoreRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DeldatastoreResponse) => void): grpc.ClientUnaryCall;
    public delDatastore(request: cln_node_pb.DeldatastoreRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DeldatastoreResponse) => void): grpc.ClientUnaryCall;
    public delDatastore(request: cln_node_pb.DeldatastoreRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DeldatastoreResponse) => void): grpc.ClientUnaryCall;
    public delInvoice(request: cln_node_pb.DelinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelinvoiceResponse) => void): grpc.ClientUnaryCall;
    public delInvoice(request: cln_node_pb.DelinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelinvoiceResponse) => void): grpc.ClientUnaryCall;
    public delInvoice(request: cln_node_pb.DelinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelinvoiceResponse) => void): grpc.ClientUnaryCall;
    public devForgetChannel(request: cln_node_pb.DevforgetchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevforgetchannelResponse) => void): grpc.ClientUnaryCall;
    public devForgetChannel(request: cln_node_pb.DevforgetchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevforgetchannelResponse) => void): grpc.ClientUnaryCall;
    public devForgetChannel(request: cln_node_pb.DevforgetchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevforgetchannelResponse) => void): grpc.ClientUnaryCall;
    public emergencyRecover(request: cln_node_pb.EmergencyrecoverRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EmergencyrecoverResponse) => void): grpc.ClientUnaryCall;
    public emergencyRecover(request: cln_node_pb.EmergencyrecoverRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EmergencyrecoverResponse) => void): grpc.ClientUnaryCall;
    public emergencyRecover(request: cln_node_pb.EmergencyrecoverRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EmergencyrecoverResponse) => void): grpc.ClientUnaryCall;
    public getEmergencyRecoverData(request: cln_node_pb.GetemergencyrecoverdataRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetemergencyrecoverdataResponse) => void): grpc.ClientUnaryCall;
    public getEmergencyRecoverData(request: cln_node_pb.GetemergencyrecoverdataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetemergencyrecoverdataResponse) => void): grpc.ClientUnaryCall;
    public getEmergencyRecoverData(request: cln_node_pb.GetemergencyrecoverdataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetemergencyrecoverdataResponse) => void): grpc.ClientUnaryCall;
    public exposeSecret(request: cln_node_pb.ExposesecretRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ExposesecretResponse) => void): grpc.ClientUnaryCall;
    public exposeSecret(request: cln_node_pb.ExposesecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ExposesecretResponse) => void): grpc.ClientUnaryCall;
    public exposeSecret(request: cln_node_pb.ExposesecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ExposesecretResponse) => void): grpc.ClientUnaryCall;
    public recover(request: cln_node_pb.RecoverRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverResponse) => void): grpc.ClientUnaryCall;
    public recover(request: cln_node_pb.RecoverRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverResponse) => void): grpc.ClientUnaryCall;
    public recover(request: cln_node_pb.RecoverRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverResponse) => void): grpc.ClientUnaryCall;
    public recoverChannel(request: cln_node_pb.RecoverchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverchannelResponse) => void): grpc.ClientUnaryCall;
    public recoverChannel(request: cln_node_pb.RecoverchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverchannelResponse) => void): grpc.ClientUnaryCall;
    public recoverChannel(request: cln_node_pb.RecoverchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RecoverchannelResponse) => void): grpc.ClientUnaryCall;
    public invoice(request: cln_node_pb.InvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoiceResponse) => void): grpc.ClientUnaryCall;
    public invoice(request: cln_node_pb.InvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoiceResponse) => void): grpc.ClientUnaryCall;
    public invoice(request: cln_node_pb.InvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoiceResponse) => void): grpc.ClientUnaryCall;
    public createInvoiceRequest(request: cln_node_pb.InvoicerequestRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoicerequestResponse) => void): grpc.ClientUnaryCall;
    public createInvoiceRequest(request: cln_node_pb.InvoicerequestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoicerequestResponse) => void): grpc.ClientUnaryCall;
    public createInvoiceRequest(request: cln_node_pb.InvoicerequestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InvoicerequestResponse) => void): grpc.ClientUnaryCall;
    public disableInvoiceRequest(request: cln_node_pb.DisableinvoicerequestRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableinvoicerequestResponse) => void): grpc.ClientUnaryCall;
    public disableInvoiceRequest(request: cln_node_pb.DisableinvoicerequestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableinvoicerequestResponse) => void): grpc.ClientUnaryCall;
    public disableInvoiceRequest(request: cln_node_pb.DisableinvoicerequestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableinvoicerequestResponse) => void): grpc.ClientUnaryCall;
    public listInvoiceRequests(request: cln_node_pb.ListinvoicerequestsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicerequestsResponse) => void): grpc.ClientUnaryCall;
    public listInvoiceRequests(request: cln_node_pb.ListinvoicerequestsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicerequestsResponse) => void): grpc.ClientUnaryCall;
    public listInvoiceRequests(request: cln_node_pb.ListinvoicerequestsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicerequestsResponse) => void): grpc.ClientUnaryCall;
    public listDatastore(request: cln_node_pb.ListdatastoreRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListdatastoreResponse) => void): grpc.ClientUnaryCall;
    public listDatastore(request: cln_node_pb.ListdatastoreRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListdatastoreResponse) => void): grpc.ClientUnaryCall;
    public listDatastore(request: cln_node_pb.ListdatastoreRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListdatastoreResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: cln_node_pb.ListinvoicesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicesResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: cln_node_pb.ListinvoicesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicesResponse) => void): grpc.ClientUnaryCall;
    public listInvoices(request: cln_node_pb.ListinvoicesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListinvoicesResponse) => void): grpc.ClientUnaryCall;
    public sendOnion(request: cln_node_pb.SendonionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendonionResponse) => void): grpc.ClientUnaryCall;
    public sendOnion(request: cln_node_pb.SendonionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendonionResponse) => void): grpc.ClientUnaryCall;
    public sendOnion(request: cln_node_pb.SendonionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendonionResponse) => void): grpc.ClientUnaryCall;
    public listSendPays(request: cln_node_pb.ListsendpaysRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListsendpaysResponse) => void): grpc.ClientUnaryCall;
    public listSendPays(request: cln_node_pb.ListsendpaysRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListsendpaysResponse) => void): grpc.ClientUnaryCall;
    public listSendPays(request: cln_node_pb.ListsendpaysRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListsendpaysResponse) => void): grpc.ClientUnaryCall;
    public listTransactions(request: cln_node_pb.ListtransactionsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListtransactionsResponse) => void): grpc.ClientUnaryCall;
    public listTransactions(request: cln_node_pb.ListtransactionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListtransactionsResponse) => void): grpc.ClientUnaryCall;
    public listTransactions(request: cln_node_pb.ListtransactionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListtransactionsResponse) => void): grpc.ClientUnaryCall;
    public makeSecret(request: cln_node_pb.MakesecretRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MakesecretResponse) => void): grpc.ClientUnaryCall;
    public makeSecret(request: cln_node_pb.MakesecretRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MakesecretResponse) => void): grpc.ClientUnaryCall;
    public makeSecret(request: cln_node_pb.MakesecretRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MakesecretResponse) => void): grpc.ClientUnaryCall;
    public pay(request: cln_node_pb.PayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PayResponse) => void): grpc.ClientUnaryCall;
    public pay(request: cln_node_pb.PayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PayResponse) => void): grpc.ClientUnaryCall;
    public pay(request: cln_node_pb.PayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PayResponse) => void): grpc.ClientUnaryCall;
    public listNodes(request: cln_node_pb.ListnodesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListnodesResponse) => void): grpc.ClientUnaryCall;
    public listNodes(request: cln_node_pb.ListnodesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListnodesResponse) => void): grpc.ClientUnaryCall;
    public listNodes(request: cln_node_pb.ListnodesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListnodesResponse) => void): grpc.ClientUnaryCall;
    public waitAnyInvoice(request: cln_node_pb.WaitanyinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitanyinvoiceResponse) => void): grpc.ClientUnaryCall;
    public waitAnyInvoice(request: cln_node_pb.WaitanyinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitanyinvoiceResponse) => void): grpc.ClientUnaryCall;
    public waitAnyInvoice(request: cln_node_pb.WaitanyinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitanyinvoiceResponse) => void): grpc.ClientUnaryCall;
    public waitInvoice(request: cln_node_pb.WaitinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitinvoiceResponse) => void): grpc.ClientUnaryCall;
    public waitInvoice(request: cln_node_pb.WaitinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitinvoiceResponse) => void): grpc.ClientUnaryCall;
    public waitInvoice(request: cln_node_pb.WaitinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitinvoiceResponse) => void): grpc.ClientUnaryCall;
    public waitSendPay(request: cln_node_pb.WaitsendpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitsendpayResponse) => void): grpc.ClientUnaryCall;
    public waitSendPay(request: cln_node_pb.WaitsendpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitsendpayResponse) => void): grpc.ClientUnaryCall;
    public waitSendPay(request: cln_node_pb.WaitsendpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitsendpayResponse) => void): grpc.ClientUnaryCall;
    public newAddr(request: cln_node_pb.NewaddrRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.NewaddrResponse) => void): grpc.ClientUnaryCall;
    public newAddr(request: cln_node_pb.NewaddrRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.NewaddrResponse) => void): grpc.ClientUnaryCall;
    public newAddr(request: cln_node_pb.NewaddrRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.NewaddrResponse) => void): grpc.ClientUnaryCall;
    public withdraw(request: cln_node_pb.WithdrawRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WithdrawResponse) => void): grpc.ClientUnaryCall;
    public withdraw(request: cln_node_pb.WithdrawRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WithdrawResponse) => void): grpc.ClientUnaryCall;
    public withdraw(request: cln_node_pb.WithdrawRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WithdrawResponse) => void): grpc.ClientUnaryCall;
    public keySend(request: cln_node_pb.KeysendRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.KeysendResponse) => void): grpc.ClientUnaryCall;
    public keySend(request: cln_node_pb.KeysendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.KeysendResponse) => void): grpc.ClientUnaryCall;
    public keySend(request: cln_node_pb.KeysendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.KeysendResponse) => void): grpc.ClientUnaryCall;
    public fundPsbt(request: cln_node_pb.FundpsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundpsbtResponse) => void): grpc.ClientUnaryCall;
    public fundPsbt(request: cln_node_pb.FundpsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundpsbtResponse) => void): grpc.ClientUnaryCall;
    public fundPsbt(request: cln_node_pb.FundpsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundpsbtResponse) => void): grpc.ClientUnaryCall;
    public sendPsbt(request: cln_node_pb.SendpsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpsbtResponse) => void): grpc.ClientUnaryCall;
    public sendPsbt(request: cln_node_pb.SendpsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpsbtResponse) => void): grpc.ClientUnaryCall;
    public sendPsbt(request: cln_node_pb.SendpsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendpsbtResponse) => void): grpc.ClientUnaryCall;
    public signPsbt(request: cln_node_pb.SignpsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignpsbtResponse) => void): grpc.ClientUnaryCall;
    public signPsbt(request: cln_node_pb.SignpsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignpsbtResponse) => void): grpc.ClientUnaryCall;
    public signPsbt(request: cln_node_pb.SignpsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignpsbtResponse) => void): grpc.ClientUnaryCall;
    public utxoPsbt(request: cln_node_pb.UtxopsbtRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UtxopsbtResponse) => void): grpc.ClientUnaryCall;
    public utxoPsbt(request: cln_node_pb.UtxopsbtRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UtxopsbtResponse) => void): grpc.ClientUnaryCall;
    public utxoPsbt(request: cln_node_pb.UtxopsbtRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UtxopsbtResponse) => void): grpc.ClientUnaryCall;
    public txDiscard(request: cln_node_pb.TxdiscardRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxdiscardResponse) => void): grpc.ClientUnaryCall;
    public txDiscard(request: cln_node_pb.TxdiscardRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxdiscardResponse) => void): grpc.ClientUnaryCall;
    public txDiscard(request: cln_node_pb.TxdiscardRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxdiscardResponse) => void): grpc.ClientUnaryCall;
    public txPrepare(request: cln_node_pb.TxprepareRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxprepareResponse) => void): grpc.ClientUnaryCall;
    public txPrepare(request: cln_node_pb.TxprepareRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxprepareResponse) => void): grpc.ClientUnaryCall;
    public txPrepare(request: cln_node_pb.TxprepareRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxprepareResponse) => void): grpc.ClientUnaryCall;
    public txSend(request: cln_node_pb.TxsendRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxsendResponse) => void): grpc.ClientUnaryCall;
    public txSend(request: cln_node_pb.TxsendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxsendResponse) => void): grpc.ClientUnaryCall;
    public txSend(request: cln_node_pb.TxsendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.TxsendResponse) => void): grpc.ClientUnaryCall;
    public listPeerChannels(request: cln_node_pb.ListpeerchannelsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeerchannelsResponse) => void): grpc.ClientUnaryCall;
    public listPeerChannels(request: cln_node_pb.ListpeerchannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeerchannelsResponse) => void): grpc.ClientUnaryCall;
    public listPeerChannels(request: cln_node_pb.ListpeerchannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpeerchannelsResponse) => void): grpc.ClientUnaryCall;
    public listClosedChannels(request: cln_node_pb.ListclosedchannelsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListclosedchannelsResponse) => void): grpc.ClientUnaryCall;
    public listClosedChannels(request: cln_node_pb.ListclosedchannelsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListclosedchannelsResponse) => void): grpc.ClientUnaryCall;
    public listClosedChannels(request: cln_node_pb.ListclosedchannelsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListclosedchannelsResponse) => void): grpc.ClientUnaryCall;
    public decodePay(request: cln_node_pb.DecodepayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodepayResponse) => void): grpc.ClientUnaryCall;
    public decodePay(request: cln_node_pb.DecodepayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodepayResponse) => void): grpc.ClientUnaryCall;
    public decodePay(request: cln_node_pb.DecodepayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodepayResponse) => void): grpc.ClientUnaryCall;
    public decode(request: cln_node_pb.DecodeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodeResponse) => void): grpc.ClientUnaryCall;
    public decode(request: cln_node_pb.DecodeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodeResponse) => void): grpc.ClientUnaryCall;
    public decode(request: cln_node_pb.DecodeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DecodeResponse) => void): grpc.ClientUnaryCall;
    public delPay(request: cln_node_pb.DelpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelpayResponse) => void): grpc.ClientUnaryCall;
    public delPay(request: cln_node_pb.DelpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelpayResponse) => void): grpc.ClientUnaryCall;
    public delPay(request: cln_node_pb.DelpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelpayResponse) => void): grpc.ClientUnaryCall;
    public delForward(request: cln_node_pb.DelforwardRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelforwardResponse) => void): grpc.ClientUnaryCall;
    public delForward(request: cln_node_pb.DelforwardRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelforwardResponse) => void): grpc.ClientUnaryCall;
    public delForward(request: cln_node_pb.DelforwardRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DelforwardResponse) => void): grpc.ClientUnaryCall;
    public disableOffer(request: cln_node_pb.DisableofferRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableofferResponse) => void): grpc.ClientUnaryCall;
    public disableOffer(request: cln_node_pb.DisableofferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableofferResponse) => void): grpc.ClientUnaryCall;
    public disableOffer(request: cln_node_pb.DisableofferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisableofferResponse) => void): grpc.ClientUnaryCall;
    public enableOffer(request: cln_node_pb.EnableofferRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EnableofferResponse) => void): grpc.ClientUnaryCall;
    public enableOffer(request: cln_node_pb.EnableofferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EnableofferResponse) => void): grpc.ClientUnaryCall;
    public enableOffer(request: cln_node_pb.EnableofferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.EnableofferResponse) => void): grpc.ClientUnaryCall;
    public disconnect(request: cln_node_pb.DisconnectRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisconnectResponse) => void): grpc.ClientUnaryCall;
    public disconnect(request: cln_node_pb.DisconnectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisconnectResponse) => void): grpc.ClientUnaryCall;
    public disconnect(request: cln_node_pb.DisconnectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DisconnectResponse) => void): grpc.ClientUnaryCall;
    public feerates(request: cln_node_pb.FeeratesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FeeratesResponse) => void): grpc.ClientUnaryCall;
    public feerates(request: cln_node_pb.FeeratesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FeeratesResponse) => void): grpc.ClientUnaryCall;
    public feerates(request: cln_node_pb.FeeratesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FeeratesResponse) => void): grpc.ClientUnaryCall;
    public fetchInvoice(request: cln_node_pb.FetchinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FetchinvoiceResponse) => void): grpc.ClientUnaryCall;
    public fetchInvoice(request: cln_node_pb.FetchinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FetchinvoiceResponse) => void): grpc.ClientUnaryCall;
    public fetchInvoice(request: cln_node_pb.FetchinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FetchinvoiceResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Cancel(request: cln_node_pb.Fundchannel_cancelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_cancelResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Cancel(request: cln_node_pb.Fundchannel_cancelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_cancelResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Cancel(request: cln_node_pb.Fundchannel_cancelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_cancelResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Complete(request: cln_node_pb.Fundchannel_completeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_completeResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Complete(request: cln_node_pb.Fundchannel_completeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_completeResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Complete(request: cln_node_pb.Fundchannel_completeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_completeResponse) => void): grpc.ClientUnaryCall;
    public fundChannel(request: cln_node_pb.FundchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundchannelResponse) => void): grpc.ClientUnaryCall;
    public fundChannel(request: cln_node_pb.FundchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundchannelResponse) => void): grpc.ClientUnaryCall;
    public fundChannel(request: cln_node_pb.FundchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FundchannelResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Start(request: cln_node_pb.Fundchannel_startRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_startResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Start(request: cln_node_pb.Fundchannel_startRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_startResponse) => void): grpc.ClientUnaryCall;
    public fundChannel_Start(request: cln_node_pb.Fundchannel_startRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Fundchannel_startResponse) => void): grpc.ClientUnaryCall;
    public getLog(request: cln_node_pb.GetlogRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetlogResponse) => void): grpc.ClientUnaryCall;
    public getLog(request: cln_node_pb.GetlogRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetlogResponse) => void): grpc.ClientUnaryCall;
    public getLog(request: cln_node_pb.GetlogRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetlogResponse) => void): grpc.ClientUnaryCall;
    public funderUpdate(request: cln_node_pb.FunderupdateRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FunderupdateResponse) => void): grpc.ClientUnaryCall;
    public funderUpdate(request: cln_node_pb.FunderupdateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FunderupdateResponse) => void): grpc.ClientUnaryCall;
    public funderUpdate(request: cln_node_pb.FunderupdateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.FunderupdateResponse) => void): grpc.ClientUnaryCall;
    public getRoute(request: cln_node_pb.GetrouteRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetrouteResponse) => void): grpc.ClientUnaryCall;
    public getRoute(request: cln_node_pb.GetrouteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetrouteResponse) => void): grpc.ClientUnaryCall;
    public getRoute(request: cln_node_pb.GetrouteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetrouteResponse) => void): grpc.ClientUnaryCall;
    public listAddresses(request: cln_node_pb.ListaddressesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListaddressesResponse) => void): grpc.ClientUnaryCall;
    public listAddresses(request: cln_node_pb.ListaddressesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListaddressesResponse) => void): grpc.ClientUnaryCall;
    public listAddresses(request: cln_node_pb.ListaddressesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListaddressesResponse) => void): grpc.ClientUnaryCall;
    public listForwards(request: cln_node_pb.ListforwardsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListforwardsResponse) => void): grpc.ClientUnaryCall;
    public listForwards(request: cln_node_pb.ListforwardsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListforwardsResponse) => void): grpc.ClientUnaryCall;
    public listForwards(request: cln_node_pb.ListforwardsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListforwardsResponse) => void): grpc.ClientUnaryCall;
    public listOffers(request: cln_node_pb.ListoffersRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListoffersResponse) => void): grpc.ClientUnaryCall;
    public listOffers(request: cln_node_pb.ListoffersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListoffersResponse) => void): grpc.ClientUnaryCall;
    public listOffers(request: cln_node_pb.ListoffersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListoffersResponse) => void): grpc.ClientUnaryCall;
    public listPays(request: cln_node_pb.ListpaysRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpaysResponse) => void): grpc.ClientUnaryCall;
    public listPays(request: cln_node_pb.ListpaysRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpaysResponse) => void): grpc.ClientUnaryCall;
    public listPays(request: cln_node_pb.ListpaysRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListpaysResponse) => void): grpc.ClientUnaryCall;
    public listHtlcs(request: cln_node_pb.ListhtlcsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListhtlcsResponse) => void): grpc.ClientUnaryCall;
    public listHtlcs(request: cln_node_pb.ListhtlcsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListhtlcsResponse) => void): grpc.ClientUnaryCall;
    public listHtlcs(request: cln_node_pb.ListhtlcsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListhtlcsResponse) => void): grpc.ClientUnaryCall;
    public multiFundChannel(request: cln_node_pb.MultifundchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultifundchannelResponse) => void): grpc.ClientUnaryCall;
    public multiFundChannel(request: cln_node_pb.MultifundchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultifundchannelResponse) => void): grpc.ClientUnaryCall;
    public multiFundChannel(request: cln_node_pb.MultifundchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultifundchannelResponse) => void): grpc.ClientUnaryCall;
    public multiWithdraw(request: cln_node_pb.MultiwithdrawRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultiwithdrawResponse) => void): grpc.ClientUnaryCall;
    public multiWithdraw(request: cln_node_pb.MultiwithdrawRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultiwithdrawResponse) => void): grpc.ClientUnaryCall;
    public multiWithdraw(request: cln_node_pb.MultiwithdrawRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.MultiwithdrawResponse) => void): grpc.ClientUnaryCall;
    public offer(request: cln_node_pb.OfferRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.OfferResponse) => void): grpc.ClientUnaryCall;
    public offer(request: cln_node_pb.OfferRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.OfferResponse) => void): grpc.ClientUnaryCall;
    public offer(request: cln_node_pb.OfferRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.OfferResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Abort(request: cln_node_pb.Openchannel_abortRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_abortResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Abort(request: cln_node_pb.Openchannel_abortRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_abortResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Abort(request: cln_node_pb.Openchannel_abortRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_abortResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Bump(request: cln_node_pb.Openchannel_bumpRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_bumpResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Bump(request: cln_node_pb.Openchannel_bumpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_bumpResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Bump(request: cln_node_pb.Openchannel_bumpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_bumpResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Init(request: cln_node_pb.Openchannel_initRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_initResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Init(request: cln_node_pb.Openchannel_initRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_initResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Init(request: cln_node_pb.Openchannel_initRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_initResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Signed(request: cln_node_pb.Openchannel_signedRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_signedResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Signed(request: cln_node_pb.Openchannel_signedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_signedResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Signed(request: cln_node_pb.Openchannel_signedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_signedResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Update(request: cln_node_pb.Openchannel_updateRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_updateResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Update(request: cln_node_pb.Openchannel_updateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_updateResponse) => void): grpc.ClientUnaryCall;
    public openChannel_Update(request: cln_node_pb.Openchannel_updateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Openchannel_updateResponse) => void): grpc.ClientUnaryCall;
    public ping(request: cln_node_pb.PingRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PingResponse) => void): grpc.ClientUnaryCall;
    public ping(request: cln_node_pb.PingRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PingResponse) => void): grpc.ClientUnaryCall;
    public ping(request: cln_node_pb.PingRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PingResponse) => void): grpc.ClientUnaryCall;
    public plugin(request: cln_node_pb.PluginRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PluginResponse) => void): grpc.ClientUnaryCall;
    public plugin(request: cln_node_pb.PluginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PluginResponse) => void): grpc.ClientUnaryCall;
    public plugin(request: cln_node_pb.PluginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PluginResponse) => void): grpc.ClientUnaryCall;
    public renePayStatus(request: cln_node_pb.RenepaystatusRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepaystatusResponse) => void): grpc.ClientUnaryCall;
    public renePayStatus(request: cln_node_pb.RenepaystatusRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepaystatusResponse) => void): grpc.ClientUnaryCall;
    public renePayStatus(request: cln_node_pb.RenepaystatusRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepaystatusResponse) => void): grpc.ClientUnaryCall;
    public renePay(request: cln_node_pb.RenepayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepayResponse) => void): grpc.ClientUnaryCall;
    public renePay(request: cln_node_pb.RenepayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepayResponse) => void): grpc.ClientUnaryCall;
    public renePay(request: cln_node_pb.RenepayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.RenepayResponse) => void): grpc.ClientUnaryCall;
    public reserveInputs(request: cln_node_pb.ReserveinputsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ReserveinputsResponse) => void): grpc.ClientUnaryCall;
    public reserveInputs(request: cln_node_pb.ReserveinputsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ReserveinputsResponse) => void): grpc.ClientUnaryCall;
    public reserveInputs(request: cln_node_pb.ReserveinputsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ReserveinputsResponse) => void): grpc.ClientUnaryCall;
    public sendCustomMsg(request: cln_node_pb.SendcustommsgRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendcustommsgResponse) => void): grpc.ClientUnaryCall;
    public sendCustomMsg(request: cln_node_pb.SendcustommsgRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendcustommsgResponse) => void): grpc.ClientUnaryCall;
    public sendCustomMsg(request: cln_node_pb.SendcustommsgRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendcustommsgResponse) => void): grpc.ClientUnaryCall;
    public sendInvoice(request: cln_node_pb.SendinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendinvoiceResponse) => void): grpc.ClientUnaryCall;
    public sendInvoice(request: cln_node_pb.SendinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendinvoiceResponse) => void): grpc.ClientUnaryCall;
    public sendInvoice(request: cln_node_pb.SendinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SendinvoiceResponse) => void): grpc.ClientUnaryCall;
    public setChannel(request: cln_node_pb.SetchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetchannelResponse) => void): grpc.ClientUnaryCall;
    public setChannel(request: cln_node_pb.SetchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetchannelResponse) => void): grpc.ClientUnaryCall;
    public setChannel(request: cln_node_pb.SetchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetchannelResponse) => void): grpc.ClientUnaryCall;
    public setConfig(request: cln_node_pb.SetconfigRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetconfigResponse) => void): grpc.ClientUnaryCall;
    public setConfig(request: cln_node_pb.SetconfigRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetconfigResponse) => void): grpc.ClientUnaryCall;
    public setConfig(request: cln_node_pb.SetconfigRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetconfigResponse) => void): grpc.ClientUnaryCall;
    public setPsbtVersion(request: cln_node_pb.SetpsbtversionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetpsbtversionResponse) => void): grpc.ClientUnaryCall;
    public setPsbtVersion(request: cln_node_pb.SetpsbtversionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetpsbtversionResponse) => void): grpc.ClientUnaryCall;
    public setPsbtVersion(request: cln_node_pb.SetpsbtversionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SetpsbtversionResponse) => void): grpc.ClientUnaryCall;
    public signInvoice(request: cln_node_pb.SigninvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SigninvoiceResponse) => void): grpc.ClientUnaryCall;
    public signInvoice(request: cln_node_pb.SigninvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SigninvoiceResponse) => void): grpc.ClientUnaryCall;
    public signInvoice(request: cln_node_pb.SigninvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SigninvoiceResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: cln_node_pb.SignmessageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignmessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: cln_node_pb.SignmessageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignmessageResponse) => void): grpc.ClientUnaryCall;
    public signMessage(request: cln_node_pb.SignmessageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.SignmessageResponse) => void): grpc.ClientUnaryCall;
    public splice_Init(request: cln_node_pb.Splice_initRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_initResponse) => void): grpc.ClientUnaryCall;
    public splice_Init(request: cln_node_pb.Splice_initRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_initResponse) => void): grpc.ClientUnaryCall;
    public splice_Init(request: cln_node_pb.Splice_initRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_initResponse) => void): grpc.ClientUnaryCall;
    public splice_Signed(request: cln_node_pb.Splice_signedRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_signedResponse) => void): grpc.ClientUnaryCall;
    public splice_Signed(request: cln_node_pb.Splice_signedRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_signedResponse) => void): grpc.ClientUnaryCall;
    public splice_Signed(request: cln_node_pb.Splice_signedRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_signedResponse) => void): grpc.ClientUnaryCall;
    public splice_Update(request: cln_node_pb.Splice_updateRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_updateResponse) => void): grpc.ClientUnaryCall;
    public splice_Update(request: cln_node_pb.Splice_updateRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_updateResponse) => void): grpc.ClientUnaryCall;
    public splice_Update(request: cln_node_pb.Splice_updateRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.Splice_updateResponse) => void): grpc.ClientUnaryCall;
    public devSplice(request: cln_node_pb.DevspliceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevspliceResponse) => void): grpc.ClientUnaryCall;
    public devSplice(request: cln_node_pb.DevspliceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevspliceResponse) => void): grpc.ClientUnaryCall;
    public devSplice(request: cln_node_pb.DevspliceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.DevspliceResponse) => void): grpc.ClientUnaryCall;
    public unreserveInputs(request: cln_node_pb.UnreserveinputsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UnreserveinputsResponse) => void): grpc.ClientUnaryCall;
    public unreserveInputs(request: cln_node_pb.UnreserveinputsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UnreserveinputsResponse) => void): grpc.ClientUnaryCall;
    public unreserveInputs(request: cln_node_pb.UnreserveinputsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UnreserveinputsResponse) => void): grpc.ClientUnaryCall;
    public upgradeWallet(request: cln_node_pb.UpgradewalletRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UpgradewalletResponse) => void): grpc.ClientUnaryCall;
    public upgradeWallet(request: cln_node_pb.UpgradewalletRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UpgradewalletResponse) => void): grpc.ClientUnaryCall;
    public upgradeWallet(request: cln_node_pb.UpgradewalletRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.UpgradewalletResponse) => void): grpc.ClientUnaryCall;
    public waitBlockHeight(request: cln_node_pb.WaitblockheightRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitblockheightResponse) => void): grpc.ClientUnaryCall;
    public waitBlockHeight(request: cln_node_pb.WaitblockheightRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitblockheightResponse) => void): grpc.ClientUnaryCall;
    public waitBlockHeight(request: cln_node_pb.WaitblockheightRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitblockheightResponse) => void): grpc.ClientUnaryCall;
    public wait(request: cln_node_pb.WaitRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitResponse) => void): grpc.ClientUnaryCall;
    public wait(request: cln_node_pb.WaitRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitResponse) => void): grpc.ClientUnaryCall;
    public wait(request: cln_node_pb.WaitRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.WaitResponse) => void): grpc.ClientUnaryCall;
    public listConfigs(request: cln_node_pb.ListconfigsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListconfigsResponse) => void): grpc.ClientUnaryCall;
    public listConfigs(request: cln_node_pb.ListconfigsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListconfigsResponse) => void): grpc.ClientUnaryCall;
    public listConfigs(request: cln_node_pb.ListconfigsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ListconfigsResponse) => void): grpc.ClientUnaryCall;
    public stop(request: cln_node_pb.StopRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stop(request: cln_node_pb.StopRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public stop(request: cln_node_pb.StopRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StopResponse) => void): grpc.ClientUnaryCall;
    public help(request: cln_node_pb.HelpRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.HelpResponse) => void): grpc.ClientUnaryCall;
    public help(request: cln_node_pb.HelpRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.HelpResponse) => void): grpc.ClientUnaryCall;
    public help(request: cln_node_pb.HelpRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.HelpResponse) => void): grpc.ClientUnaryCall;
    public preApproveKeysend(request: cln_node_pb.PreapprovekeysendRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapprovekeysendResponse) => void): grpc.ClientUnaryCall;
    public preApproveKeysend(request: cln_node_pb.PreapprovekeysendRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapprovekeysendResponse) => void): grpc.ClientUnaryCall;
    public preApproveKeysend(request: cln_node_pb.PreapprovekeysendRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapprovekeysendResponse) => void): grpc.ClientUnaryCall;
    public preApproveInvoice(request: cln_node_pb.PreapproveinvoiceRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapproveinvoiceResponse) => void): grpc.ClientUnaryCall;
    public preApproveInvoice(request: cln_node_pb.PreapproveinvoiceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapproveinvoiceResponse) => void): grpc.ClientUnaryCall;
    public preApproveInvoice(request: cln_node_pb.PreapproveinvoiceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.PreapproveinvoiceResponse) => void): grpc.ClientUnaryCall;
    public staticBackup(request: cln_node_pb.StaticbackupRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StaticbackupResponse) => void): grpc.ClientUnaryCall;
    public staticBackup(request: cln_node_pb.StaticbackupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StaticbackupResponse) => void): grpc.ClientUnaryCall;
    public staticBackup(request: cln_node_pb.StaticbackupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.StaticbackupResponse) => void): grpc.ClientUnaryCall;
    public bkprChannelsApy(request: cln_node_pb.BkprchannelsapyRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprchannelsapyResponse) => void): grpc.ClientUnaryCall;
    public bkprChannelsApy(request: cln_node_pb.BkprchannelsapyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprchannelsapyResponse) => void): grpc.ClientUnaryCall;
    public bkprChannelsApy(request: cln_node_pb.BkprchannelsapyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprchannelsapyResponse) => void): grpc.ClientUnaryCall;
    public bkprDumpIncomeCsv(request: cln_node_pb.BkprdumpincomecsvRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprdumpincomecsvResponse) => void): grpc.ClientUnaryCall;
    public bkprDumpIncomeCsv(request: cln_node_pb.BkprdumpincomecsvRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprdumpincomecsvResponse) => void): grpc.ClientUnaryCall;
    public bkprDumpIncomeCsv(request: cln_node_pb.BkprdumpincomecsvRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprdumpincomecsvResponse) => void): grpc.ClientUnaryCall;
    public bkprInspect(request: cln_node_pb.BkprinspectRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprinspectResponse) => void): grpc.ClientUnaryCall;
    public bkprInspect(request: cln_node_pb.BkprinspectRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprinspectResponse) => void): grpc.ClientUnaryCall;
    public bkprInspect(request: cln_node_pb.BkprinspectRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprinspectResponse) => void): grpc.ClientUnaryCall;
    public bkprListAccountEvents(request: cln_node_pb.BkprlistaccounteventsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistaccounteventsResponse) => void): grpc.ClientUnaryCall;
    public bkprListAccountEvents(request: cln_node_pb.BkprlistaccounteventsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistaccounteventsResponse) => void): grpc.ClientUnaryCall;
    public bkprListAccountEvents(request: cln_node_pb.BkprlistaccounteventsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistaccounteventsResponse) => void): grpc.ClientUnaryCall;
    public bkprListBalances(request: cln_node_pb.BkprlistbalancesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistbalancesResponse) => void): grpc.ClientUnaryCall;
    public bkprListBalances(request: cln_node_pb.BkprlistbalancesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistbalancesResponse) => void): grpc.ClientUnaryCall;
    public bkprListBalances(request: cln_node_pb.BkprlistbalancesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistbalancesResponse) => void): grpc.ClientUnaryCall;
    public bkprListIncome(request: cln_node_pb.BkprlistincomeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistincomeResponse) => void): grpc.ClientUnaryCall;
    public bkprListIncome(request: cln_node_pb.BkprlistincomeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistincomeResponse) => void): grpc.ClientUnaryCall;
    public bkprListIncome(request: cln_node_pb.BkprlistincomeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkprlistincomeResponse) => void): grpc.ClientUnaryCall;
    public bkprEditDescriptionByPaymentId(request: cln_node_pb.BkpreditdescriptionbypaymentidRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbypaymentidResponse) => void): grpc.ClientUnaryCall;
    public bkprEditDescriptionByPaymentId(request: cln_node_pb.BkpreditdescriptionbypaymentidRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbypaymentidResponse) => void): grpc.ClientUnaryCall;
    public bkprEditDescriptionByPaymentId(request: cln_node_pb.BkpreditdescriptionbypaymentidRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbypaymentidResponse) => void): grpc.ClientUnaryCall;
    public bkprEditDescriptionByOutpoint(request: cln_node_pb.BkpreditdescriptionbyoutpointRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbyoutpointResponse) => void): grpc.ClientUnaryCall;
    public bkprEditDescriptionByOutpoint(request: cln_node_pb.BkpreditdescriptionbyoutpointRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbyoutpointResponse) => void): grpc.ClientUnaryCall;
    public bkprEditDescriptionByOutpoint(request: cln_node_pb.BkpreditdescriptionbyoutpointRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BkpreditdescriptionbyoutpointResponse) => void): grpc.ClientUnaryCall;
    public blacklistRune(request: cln_node_pb.BlacklistruneRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BlacklistruneResponse) => void): grpc.ClientUnaryCall;
    public blacklistRune(request: cln_node_pb.BlacklistruneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BlacklistruneResponse) => void): grpc.ClientUnaryCall;
    public blacklistRune(request: cln_node_pb.BlacklistruneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.BlacklistruneResponse) => void): grpc.ClientUnaryCall;
    public checkRune(request: cln_node_pb.CheckruneRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckruneResponse) => void): grpc.ClientUnaryCall;
    public checkRune(request: cln_node_pb.CheckruneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckruneResponse) => void): grpc.ClientUnaryCall;
    public checkRune(request: cln_node_pb.CheckruneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CheckruneResponse) => void): grpc.ClientUnaryCall;
    public createRune(request: cln_node_pb.CreateruneRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateruneResponse) => void): grpc.ClientUnaryCall;
    public createRune(request: cln_node_pb.CreateruneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateruneResponse) => void): grpc.ClientUnaryCall;
    public createRune(request: cln_node_pb.CreateruneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.CreateruneResponse) => void): grpc.ClientUnaryCall;
    public showRunes(request: cln_node_pb.ShowrunesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ShowrunesResponse) => void): grpc.ClientUnaryCall;
    public showRunes(request: cln_node_pb.ShowrunesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ShowrunesResponse) => void): grpc.ClientUnaryCall;
    public showRunes(request: cln_node_pb.ShowrunesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.ShowrunesResponse) => void): grpc.ClientUnaryCall;
    public askReneUnreserve(request: cln_node_pb.AskreneunreserveRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneunreserveResponse) => void): grpc.ClientUnaryCall;
    public askReneUnreserve(request: cln_node_pb.AskreneunreserveRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneunreserveResponse) => void): grpc.ClientUnaryCall;
    public askReneUnreserve(request: cln_node_pb.AskreneunreserveRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneunreserveResponse) => void): grpc.ClientUnaryCall;
    public askReneListLayers(request: cln_node_pb.AskrenelistlayersRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistlayersResponse) => void): grpc.ClientUnaryCall;
    public askReneListLayers(request: cln_node_pb.AskrenelistlayersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistlayersResponse) => void): grpc.ClientUnaryCall;
    public askReneListLayers(request: cln_node_pb.AskrenelistlayersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistlayersResponse) => void): grpc.ClientUnaryCall;
    public askReneCreateLayer(request: cln_node_pb.AskrenecreatelayerRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatelayerResponse) => void): grpc.ClientUnaryCall;
    public askReneCreateLayer(request: cln_node_pb.AskrenecreatelayerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatelayerResponse) => void): grpc.ClientUnaryCall;
    public askReneCreateLayer(request: cln_node_pb.AskrenecreatelayerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatelayerResponse) => void): grpc.ClientUnaryCall;
    public askReneRemoveLayer(request: cln_node_pb.AskreneremovelayerRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneremovelayerResponse) => void): grpc.ClientUnaryCall;
    public askReneRemoveLayer(request: cln_node_pb.AskreneremovelayerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneremovelayerResponse) => void): grpc.ClientUnaryCall;
    public askReneRemoveLayer(request: cln_node_pb.AskreneremovelayerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneremovelayerResponse) => void): grpc.ClientUnaryCall;
    public askReneReserve(request: cln_node_pb.AskrenereserveRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenereserveResponse) => void): grpc.ClientUnaryCall;
    public askReneReserve(request: cln_node_pb.AskrenereserveRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenereserveResponse) => void): grpc.ClientUnaryCall;
    public askReneReserve(request: cln_node_pb.AskrenereserveRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenereserveResponse) => void): grpc.ClientUnaryCall;
    public askReneAge(request: cln_node_pb.AskreneageRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneageResponse) => void): grpc.ClientUnaryCall;
    public askReneAge(request: cln_node_pb.AskreneageRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneageResponse) => void): grpc.ClientUnaryCall;
    public askReneAge(request: cln_node_pb.AskreneageRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneageResponse) => void): grpc.ClientUnaryCall;
    public getRoutes(request: cln_node_pb.GetroutesRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetroutesResponse) => void): grpc.ClientUnaryCall;
    public getRoutes(request: cln_node_pb.GetroutesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetroutesResponse) => void): grpc.ClientUnaryCall;
    public getRoutes(request: cln_node_pb.GetroutesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.GetroutesResponse) => void): grpc.ClientUnaryCall;
    public askReneDisableNode(request: cln_node_pb.AskrenedisablenodeRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenedisablenodeResponse) => void): grpc.ClientUnaryCall;
    public askReneDisableNode(request: cln_node_pb.AskrenedisablenodeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenedisablenodeResponse) => void): grpc.ClientUnaryCall;
    public askReneDisableNode(request: cln_node_pb.AskrenedisablenodeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenedisablenodeResponse) => void): grpc.ClientUnaryCall;
    public askReneInformChannel(request: cln_node_pb.AskreneinformchannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneinformchannelResponse) => void): grpc.ClientUnaryCall;
    public askReneInformChannel(request: cln_node_pb.AskreneinformchannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneinformchannelResponse) => void): grpc.ClientUnaryCall;
    public askReneInformChannel(request: cln_node_pb.AskreneinformchannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneinformchannelResponse) => void): grpc.ClientUnaryCall;
    public askReneCreateChannel(request: cln_node_pb.AskrenecreatechannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatechannelResponse) => void): grpc.ClientUnaryCall;
    public askReneCreateChannel(request: cln_node_pb.AskrenecreatechannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatechannelResponse) => void): grpc.ClientUnaryCall;
    public askReneCreateChannel(request: cln_node_pb.AskrenecreatechannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenecreatechannelResponse) => void): grpc.ClientUnaryCall;
    public askReneUpdateChannel(request: cln_node_pb.AskreneupdatechannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneupdatechannelResponse) => void): grpc.ClientUnaryCall;
    public askReneUpdateChannel(request: cln_node_pb.AskreneupdatechannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneupdatechannelResponse) => void): grpc.ClientUnaryCall;
    public askReneUpdateChannel(request: cln_node_pb.AskreneupdatechannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskreneupdatechannelResponse) => void): grpc.ClientUnaryCall;
    public askReneBiasChannel(request: cln_node_pb.AskrenebiaschannelRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenebiaschannelResponse) => void): grpc.ClientUnaryCall;
    public askReneBiasChannel(request: cln_node_pb.AskrenebiaschannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenebiaschannelResponse) => void): grpc.ClientUnaryCall;
    public askReneBiasChannel(request: cln_node_pb.AskrenebiaschannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenebiaschannelResponse) => void): grpc.ClientUnaryCall;
    public askReneListReservations(request: cln_node_pb.AskrenelistreservationsRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistreservationsResponse) => void): grpc.ClientUnaryCall;
    public askReneListReservations(request: cln_node_pb.AskrenelistreservationsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistreservationsResponse) => void): grpc.ClientUnaryCall;
    public askReneListReservations(request: cln_node_pb.AskrenelistreservationsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.AskrenelistreservationsResponse) => void): grpc.ClientUnaryCall;
    public injectPaymentOnion(request: cln_node_pb.InjectpaymentonionRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InjectpaymentonionResponse) => void): grpc.ClientUnaryCall;
    public injectPaymentOnion(request: cln_node_pb.InjectpaymentonionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InjectpaymentonionResponse) => void): grpc.ClientUnaryCall;
    public injectPaymentOnion(request: cln_node_pb.InjectpaymentonionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.InjectpaymentonionResponse) => void): grpc.ClientUnaryCall;
    public xpay(request: cln_node_pb.XpayRequest, callback: (error: grpc.ServiceError | null, response: cln_node_pb.XpayResponse) => void): grpc.ClientUnaryCall;
    public xpay(request: cln_node_pb.XpayRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cln_node_pb.XpayResponse) => void): grpc.ClientUnaryCall;
    public xpay(request: cln_node_pb.XpayRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cln_node_pb.XpayResponse) => void): grpc.ClientUnaryCall;
    public subscribeBlockAdded(request: cln_node_pb.StreamBlockAddedRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.BlockAddedNotification>;
    public subscribeBlockAdded(request: cln_node_pb.StreamBlockAddedRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.BlockAddedNotification>;
    public subscribeChannelOpenFailed(request: cln_node_pb.StreamChannelOpenFailedRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenFailedNotification>;
    public subscribeChannelOpenFailed(request: cln_node_pb.StreamChannelOpenFailedRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenFailedNotification>;
    public subscribeChannelOpened(request: cln_node_pb.StreamChannelOpenedRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenedNotification>;
    public subscribeChannelOpened(request: cln_node_pb.StreamChannelOpenedRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.ChannelOpenedNotification>;
    public subscribeConnect(request: cln_node_pb.StreamConnectRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.PeerConnectNotification>;
    public subscribeConnect(request: cln_node_pb.StreamConnectRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.PeerConnectNotification>;
    public subscribeCustomMsg(request: cln_node_pb.StreamCustomMsgRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.CustomMsgNotification>;
    public subscribeCustomMsg(request: cln_node_pb.StreamCustomMsgRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<cln_node_pb.CustomMsgNotification>;
}
