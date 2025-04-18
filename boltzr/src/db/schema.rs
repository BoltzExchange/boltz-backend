use diesel::{allow_tables_to_appear_in_same_query, joinable};

diesel::table! {
    web_hooks (id) {
        id -> Text,
        state -> Text,
        url -> Text,
        hash_swap_id -> Bool,
        status -> Nullable<Array<Text>>,
    }
}

diesel::table! {
    offers (signer) {
        signer -> Binary,
        offer -> Text,
        url -> Nullable<Text>,
    }
}

diesel::table! {
    referrals (id) {
        id -> Text,
        config -> Nullable<Json>,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    swaps (id) {
        id -> Text,
        version -> Integer,
        referral -> Nullable<Text>,
        pair -> Text,
        orderSide -> Integer,
        status -> Text,
        failureReason -> Nullable<Text>,
        preimageHash -> Text,
        invoice -> Nullable<Text>,
        keyIndex -> Nullable<Integer>,
        refundPublicKey -> Nullable<Text>,
        timeoutBlockHeight -> Integer,
        redeemScript -> Nullable<Text>,
        lockupAddress -> Text,
        lockupTransactionId -> Nullable<Text>,
        lockupTransactionVout -> Nullable<Integer>,
        createdAt -> Timestamptz,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    reverseSwaps (id) {
        id -> Text,
        pair -> Text,
        orderSide -> Integer,
        status -> Text,
        transactionId -> Nullable<Text>,
        transactionVout -> Nullable<Integer>,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    chainSwaps (id) {
        id -> Text,
        pair -> Text,
        orderSide -> Integer,
        status -> Text,
        preimageHash -> Text,
        createdAt -> Timestamptz,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    chainSwapData (swapId, symbol) {
        swapId -> Text,
        symbol -> Text,
        keyIndex -> Nullable<Integer>,
        theirPublicKey -> Nullable<Text>,
        swapTree -> Nullable<Text>,
        timeoutBlockHeight -> Integer,
        lockupAddress -> Text,
        transactionId -> Nullable<Text>,
        transactionVout -> Nullable<Integer>,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    keys (symbol) {
        symbol -> Text,
        derivationPath -> Text,
        highestUsedIndex -> Integer,
    }
}

joinable!(chainSwapData -> chainSwaps (swapId));
allow_tables_to_appear_in_same_query!(chainSwaps, chainSwapData);
