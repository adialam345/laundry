import { useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(callback: () => void, isLoading: boolean) {
    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading) {
            callback();
        }
    }, [callback, isLoading]);

    useEffect(() => {
        if (isLoading) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '20px',
            threshold: 1.0
        });

        if (sentinelRef.current) {
            observer.current.observe(sentinelRef.current);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [handleObserver, isLoading]);

    return sentinelRef;
}
