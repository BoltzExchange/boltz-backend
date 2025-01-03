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
    #[allow(non_snake_case)]
    swaps (id) {
        id -> Text,
        pair -> Text,
        orderSide -> Integer,
        status -> Text,
        failureReason -> Nullable<Text>,
        invoice -> Nullable<Text>,
        lockupAddress -> Text,
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
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    chainSwapData (swapId, symbol) {
        swapId -> Text,
        symbol -> Text,
        lockupAddress -> Text,
        transactionId -> Nullable<Text>,
        transactionVout -> Nullable<Integer>,
    }
}

joinable!(chainSwapData -> chainSwaps (swapId));
allow_tables_to_appear_in_same_query!(chainSwaps, chainSwapData);
