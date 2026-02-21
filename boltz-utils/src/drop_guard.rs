pub struct DropGuard<F: FnOnce()> {
    cleanup: Option<F>,
}

impl<F: FnOnce()> std::fmt::Debug for DropGuard<F> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("DropGuard").finish_non_exhaustive()
    }
}

impl<F: FnOnce()> DropGuard<F> {
    pub fn new(f: F) -> DropGuard<F> {
        DropGuard { cleanup: Some(f) }
    }
}

impl<F: FnOnce()> Drop for DropGuard<F> {
    fn drop(&mut self) {
        if let Some(f) = self.cleanup.take() {
            f();
        }
    }
}

pub fn defer<F: FnOnce()>(f: F) -> DropGuard<F> {
    DropGuard::new(f)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{
        Arc,
        atomic::{AtomicBool, AtomicUsize, Ordering},
    };

    #[test]
    fn executes_closure_on_drop() {
        let called = Arc::new(AtomicBool::new(false));
        {
            let called_clone = called.clone();
            let _guard = defer(move || {
                called_clone.store(true, Ordering::SeqCst);
            });
            assert!(!called.load(Ordering::SeqCst));
        }
        assert!(called.load(Ordering::SeqCst));
    }

    #[test]
    fn executes_closure_only_once() {
        let counter = Arc::new(AtomicUsize::new(0));
        {
            let counter_clone = counter.clone();
            let guard = DropGuard::new(move || {
                counter_clone.fetch_add(1, Ordering::SeqCst);
            });
            let _moved_guard = guard;
            assert_eq!(counter.load(Ordering::SeqCst), 0);
        }
        assert_eq!(counter.load(Ordering::SeqCst), 1);
    }
}
