// package: mpay
// file: mpay.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetInfoRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetInfoRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetInfoRequest): GetInfoRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetInfoRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetInfoRequest;
    static deserializeBinaryFromReader(message: GetInfoRequest, reader: jspb.BinaryReader): GetInfoRequest;
}

export namespace GetInfoRequest {
    export type AsObject = {
    }
}

export class GetInfoResponse extends jspb.Message { 
    getVersion(): string;
    setVersion(value: string): GetInfoResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetInfoResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetInfoResponse): GetInfoResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetInfoResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetInfoResponse;
    static deserializeBinaryFromReader(message: GetInfoResponse, reader: jspb.BinaryReader): GetInfoResponse;
}

export namespace GetInfoResponse {
    export type AsObject = {
        version: string,
    }
}

export class GetRoutesRequest extends jspb.Message { 

    hasDestination(): boolean;
    clearDestination(): void;
    getDestination(): string | undefined;
    setDestination(value: string): GetRoutesRequest;

    hasMinSuccess(): boolean;
    clearMinSuccess(): void;
    getMinSuccess(): number | undefined;
    setMinSuccess(value: number): GetRoutesRequest;

    hasMinSuccessEma(): boolean;
    clearMinSuccessEma(): void;
    getMinSuccessEma(): number | undefined;
    setMinSuccessEma(value: number): GetRoutesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoutesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoutesRequest): GetRoutesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoutesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoutesRequest;
    static deserializeBinaryFromReader(message: GetRoutesRequest, reader: jspb.BinaryReader): GetRoutesRequest;
}

export namespace GetRoutesRequest {
    export type AsObject = {
        destination?: string,
        minSuccess?: number,
        minSuccessEma?: number,
    }
}

export class GetRoutesResponse extends jspb.Message { 

    getRoutesMap(): jspb.Map<string, GetRoutesResponse.Routes>;
    clearRoutesMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoutesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoutesResponse): GetRoutesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoutesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoutesResponse;
    static deserializeBinaryFromReader(message: GetRoutesResponse, reader: jspb.BinaryReader): GetRoutesResponse;
}

export namespace GetRoutesResponse {
    export type AsObject = {

        routesMap: Array<[string, GetRoutesResponse.Routes.AsObject]>,
    }


    export class Routes extends jspb.Message { 
        clearRoutesList(): void;
        getRoutesList(): Array<GetRoutesResponse.Routes.Route>;
        setRoutesList(value: Array<GetRoutesResponse.Routes.Route>): Routes;
        addRoutes(value?: GetRoutesResponse.Routes.Route, index?: number): GetRoutesResponse.Routes.Route;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Routes.AsObject;
        static toObject(includeInstance: boolean, msg: Routes): Routes.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Routes, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Routes;
        static deserializeBinaryFromReader(message: Routes, reader: jspb.BinaryReader): Routes;
    }

    export namespace Routes {
        export type AsObject = {
            routesList: Array<GetRoutesResponse.Routes.Route.AsObject>,
        }


        export class Route extends jspb.Message { 
            clearRouteList(): void;
            getRouteList(): Array<string>;
            setRouteList(value: Array<string>): Route;
            addRoute(value: string, index?: number): string;
            getSuccessRate(): number;
            setSuccessRate(value: number): Route;
            getSuccessRateEma(): number;
            setSuccessRateEma(value: number): Route;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Route.AsObject;
            static toObject(includeInstance: boolean, msg: Route): Route.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Route, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Route;
            static deserializeBinaryFromReader(message: Route, reader: jspb.BinaryReader): Route;
        }

        export namespace Route {
            export type AsObject = {
                routeList: Array<string>,
                successRate: number,
                successRateEma: number,
            }
        }

    }

}

export class ListPaymentsRequest extends jspb.Message { 

    hasBolt11(): boolean;
    clearBolt11(): void;
    getBolt11(): string;
    setBolt11(value: string): ListPaymentsRequest;

    hasPaymentHash(): boolean;
    clearPaymentHash(): void;
    getPaymentHash(): string;
    setPaymentHash(value: string): ListPaymentsRequest;

    getIdentifierCase(): ListPaymentsRequest.IdentifierCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPaymentsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListPaymentsRequest): ListPaymentsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPaymentsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPaymentsRequest;
    static deserializeBinaryFromReader(message: ListPaymentsRequest, reader: jspb.BinaryReader): ListPaymentsRequest;
}

export namespace ListPaymentsRequest {
    export type AsObject = {
        bolt11: string,
        paymentHash: string,
    }

    export enum IdentifierCase {
        IDENTIFIER_NOT_SET = 0,
        BOLT11 = 1,
        PAYMENT_HASH = 2,
    }

}

export class ListPaymentsResponse extends jspb.Message { 
    clearPaymentsList(): void;
    getPaymentsList(): Array<ListPaymentsResponse.Payment>;
    setPaymentsList(value: Array<ListPaymentsResponse.Payment>): ListPaymentsResponse;
    addPayments(value?: ListPaymentsResponse.Payment, index?: number): ListPaymentsResponse.Payment;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPaymentsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListPaymentsResponse): ListPaymentsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPaymentsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPaymentsResponse;
    static deserializeBinaryFromReader(message: ListPaymentsResponse, reader: jspb.BinaryReader): ListPaymentsResponse;
}

export namespace ListPaymentsResponse {
    export type AsObject = {
        paymentsList: Array<ListPaymentsResponse.Payment.AsObject>,
    }


    export class Payment extends jspb.Message { 
        getId(): number;
        setId(value: number): Payment;
        getDestination(): string;
        setDestination(value: string): Payment;
        getPaymentHash(): string;
        setPaymentHash(value: string): Payment;
        getAmount(): number;
        setAmount(value: number): Payment;
        getOk(): boolean;
        setOk(value: boolean): Payment;
        clearAttemptsList(): void;
        getAttemptsList(): Array<ListPaymentsResponse.Payment.Attempt>;
        setAttemptsList(value: Array<ListPaymentsResponse.Payment.Attempt>): Payment;
        addAttempts(value?: ListPaymentsResponse.Payment.Attempt, index?: number): ListPaymentsResponse.Payment.Attempt;
        getCreatedAt(): number;
        setCreatedAt(value: number): Payment;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): Payment.AsObject;
        static toObject(includeInstance: boolean, msg: Payment): Payment.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: Payment, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): Payment;
        static deserializeBinaryFromReader(message: Payment, reader: jspb.BinaryReader): Payment;
    }

    export namespace Payment {
        export type AsObject = {
            id: number,
            destination: string,
            paymentHash: string,
            amount: number,
            ok: boolean,
            attemptsList: Array<ListPaymentsResponse.Payment.Attempt.AsObject>,
            createdAt: number,
        }


        export class Attempt extends jspb.Message { 
            getId(): number;
            setId(value: number): Attempt;
            getOk(): boolean;
            setOk(value: boolean): Attempt;
            getTime(): number;
            setTime(value: number): Attempt;
            clearHopsList(): void;
            getHopsList(): Array<ListPaymentsResponse.Payment.Attempt.Hop>;
            setHopsList(value: Array<ListPaymentsResponse.Payment.Attempt.Hop>): Attempt;
            addHops(value?: ListPaymentsResponse.Payment.Attempt.Hop, index?: number): ListPaymentsResponse.Payment.Attempt.Hop;
            getCreatedAt(): number;
            setCreatedAt(value: number): Attempt;

            serializeBinary(): Uint8Array;
            toObject(includeInstance?: boolean): Attempt.AsObject;
            static toObject(includeInstance: boolean, msg: Attempt): Attempt.AsObject;
            static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
            static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
            static serializeBinaryToWriter(message: Attempt, writer: jspb.BinaryWriter): void;
            static deserializeBinary(bytes: Uint8Array): Attempt;
            static deserializeBinaryFromReader(message: Attempt, reader: jspb.BinaryReader): Attempt;
        }

        export namespace Attempt {
            export type AsObject = {
                id: number,
                ok: boolean,
                time: number,
                hopsList: Array<ListPaymentsResponse.Payment.Attempt.Hop.AsObject>,
                createdAt: number,
            }


            export class Hop extends jspb.Message { 
                getId(): number;
                setId(value: number): Hop;
                getNode(): string;
                setNode(value: string): Hop;
                getChannel(): string;
                setChannel(value: string): Hop;
                getDirection(): number;
                setDirection(value: number): Hop;
                getOk(): boolean;
                setOk(value: boolean): Hop;

                serializeBinary(): Uint8Array;
                toObject(includeInstance?: boolean): Hop.AsObject;
                static toObject(includeInstance: boolean, msg: Hop): Hop.AsObject;
                static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
                static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
                static serializeBinaryToWriter(message: Hop, writer: jspb.BinaryWriter): void;
                static deserializeBinary(bytes: Uint8Array): Hop;
                static deserializeBinaryFromReader(message: Hop, reader: jspb.BinaryReader): Hop;
            }

            export namespace Hop {
                export type AsObject = {
                    id: number,
                    node: string,
                    channel: string,
                    direction: number,
                    ok: boolean,
                }
            }

        }

    }

}

export class PayRequest extends jspb.Message { 
    getBolt11(): string;
    setBolt11(value: string): PayRequest;

    hasMaxFeeMsat(): boolean;
    clearMaxFeeMsat(): void;
    getMaxFeeMsat(): number | undefined;
    setMaxFeeMsat(value: number): PayRequest;

    hasExemptFeeMsat(): boolean;
    clearExemptFeeMsat(): void;
    getExemptFeeMsat(): number | undefined;
    setExemptFeeMsat(value: number): PayRequest;

    hasTimeout(): boolean;
    clearTimeout(): void;
    getTimeout(): number | undefined;
    setTimeout(value: number): PayRequest;

    hasMaxDelay(): boolean;
    clearMaxDelay(): void;
    getMaxDelay(): number | undefined;
    setMaxDelay(value: number): PayRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PayRequest): PayRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayRequest;
    static deserializeBinaryFromReader(message: PayRequest, reader: jspb.BinaryReader): PayRequest;
}

export namespace PayRequest {
    export type AsObject = {
        bolt11: string,
        maxFeeMsat?: number,
        exemptFeeMsat?: number,
        timeout?: number,
        maxDelay?: number,
    }
}

export class PayResponse extends jspb.Message { 
    getPaymentHash(): string;
    setPaymentHash(value: string): PayResponse;
    getPaymentPreimage(): string;
    setPaymentPreimage(value: string): PayResponse;
    getFeeMsat(): number;
    setFeeMsat(value: number): PayResponse;
    getTime(): number;
    setTime(value: number): PayResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PayResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PayResponse): PayResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PayResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PayResponse;
    static deserializeBinaryFromReader(message: PayResponse, reader: jspb.BinaryReader): PayResponse;
}

export namespace PayResponse {
    export type AsObject = {
        paymentHash: string,
        paymentPreimage: string,
        feeMsat: number,
        time: number,
    }
}

export class ResetPathMemoryRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResetPathMemoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ResetPathMemoryRequest): ResetPathMemoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResetPathMemoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResetPathMemoryRequest;
    static deserializeBinaryFromReader(message: ResetPathMemoryRequest, reader: jspb.BinaryReader): ResetPathMemoryRequest;
}

export namespace ResetPathMemoryRequest {
    export type AsObject = {
    }
}

export class ResetPathMemoryResponse extends jspb.Message { 
    getPayments(): number;
    setPayments(value: number): ResetPathMemoryResponse;
    getAttempts(): number;
    setAttempts(value: number): ResetPathMemoryResponse;
    getHops(): number;
    setHops(value: number): ResetPathMemoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResetPathMemoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ResetPathMemoryResponse): ResetPathMemoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResetPathMemoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResetPathMemoryResponse;
    static deserializeBinaryFromReader(message: ResetPathMemoryResponse, reader: jspb.BinaryReader): ResetPathMemoryResponse;
}

export namespace ResetPathMemoryResponse {
    export type AsObject = {
        payments: number,
        attempts: number,
        hops: number,
    }
}
