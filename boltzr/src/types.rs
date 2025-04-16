pub trait Bool {}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct True {}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct False {}

impl Bool for True {}
impl Bool for False {}
