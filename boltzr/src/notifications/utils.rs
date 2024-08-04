pub const CODE_BLOCK: &str = "```";

pub fn format_prefix(prefix: &str) -> String {
    format!("[{}]: ", prefix)
}

pub fn split_message(max_len: usize, message: &str) -> Vec<String> {
    let is_code_block = contains_code_block(message);

    let to_split = if is_code_block {
        message
            .strip_prefix(CODE_BLOCK)
            .unwrap_or(message)
            .strip_suffix(CODE_BLOCK)
            .unwrap_or(message)
    } else {
        message
    };
    let max_part_len = if is_code_block {
        max_len - (CODE_BLOCK.len() * 2 + 10)
    } else {
        max_len
    };

    let split = split_string(max_part_len, to_split);
    if is_code_block {
        split
            .iter()
            .map(|entry| format!("{}json\n{}\n{}", CODE_BLOCK, entry, CODE_BLOCK))
            .collect()
    } else {
        split
    }
}

pub fn contains_code_block(message: &str) -> bool {
    message.contains(CODE_BLOCK)
}

fn split_string(chunk_size: usize, input: &str) -> Vec<String> {
    input
        .chars()
        .collect::<Vec<_>>()
        .chunks(chunk_size)
        .map(|chunk| chunk.iter().collect())
        .collect()
}

#[cfg(test)]
mod test {
    use crate::notifications::utils::*;

    #[test]
    fn test_format_prefix() {
        assert_eq!(format_prefix("Test"), "[Test]: ");
    }

    #[test]
    fn test_contains_code_block() {
        assert!(contains_code_block("```"));
        assert!(!contains_code_block("``"));
        assert!(!contains_code_block("not code"));
    }

    #[test]
    fn test_split_string() {
        assert_eq!(split_string(5, "Hello, world!"), vec!["Hello", ", wor", "ld!"]);
    }

    #[test]
    fn test_split_message() {
        assert_eq!(split_message(5, "Hello, world!"), vec!["Hello", ", wor", "ld!"]);
    }

    #[test]
    fn test_split_message_code() {
        assert_eq!(
            split_message(40, "```{\"some\": \"really cool data\"}```"),
            vec!["```json\n{\"some\": \"really cool da\n```", "```json\nta\"}\n```"],
        );
    }
}
