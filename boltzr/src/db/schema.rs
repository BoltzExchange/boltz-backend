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
    swaps (id) {
        id -> Text,
        status -> Text,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    reverseSwaps (id) {
        id -> Text,
        status -> Text,
    }
}

diesel::table! {
    #[allow(non_snake_case)]
    chainSwaps (id) {
        id -> Text,
        status -> Text,
    }
}
