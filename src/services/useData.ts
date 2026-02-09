// React hook for reactive data fetching - replaces useLiveQuery from Dexie
import { useState, useEffect, useCallback } from 'react';
import { subscribeToDataChanges } from './dataService';

/**
 * A hook that fetches data and re-fetches when data changes.
 * Replaces Dexie's useLiveQuery with a similar API.
 * 
 * @param queryFn - Async function that returns the data
 * @param deps - Dependency array to re-run the query
 * @param defaultValue - Default value while loading
 */
export function useData<T>(
    queryFn: () => Promise<T>,
    deps: React.DependencyList = [],
    defaultValue?: T
): T | undefined {
    const [data, setData] = useState<T | undefined>(defaultValue);
    const [, setVersion] = useState(0);

    // Memoize the query function
    const memoizedQuery = useCallback(queryFn, deps);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            const result = await memoizedQuery();
            setData(result);
        } catch (error) {
            console.error('useData fetch error:', error);
        }
    }, [memoizedQuery]);

    // Initial fetch and subscribe to changes
    useEffect(() => {
        fetchData();

        // Subscribe to data changes
        const unsubscribe = subscribeToDataChanges(() => {
            setVersion(v => v + 1);
            fetchData();
        });

        return () => {
            unsubscribe();
        };
    }, [fetchData]);

    return data;
}

/**
 * A simpler hook that triggers a re-render when data changes.
 * Useful when you need to manually control when to fetch.
 */
export function useDataRefresh(): number {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const unsubscribe = subscribeToDataChanges(() => {
            setVersion(v => v + 1);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return version;
}
