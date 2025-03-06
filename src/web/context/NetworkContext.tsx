import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  RequestConfig,
  ResponseData,
  CrawlerConfig,
  CrawlerResult,
  NetworkState,
} from '../types/network';
import * as networkService from '../services/network';

type NetworkAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | {
      type: 'SET_REQUEST';
      payload: {
        id: string;
        config: RequestConfig;
        status: 'pending' | 'completed' | 'failed';
        response?: ResponseData;
        error?: Error;
      };
    }
  | { type: 'REMOVE_REQUEST'; payload: string }
  | {
      type: 'SET_CRAWLER';
      payload: {
        id: string;
        config: CrawlerConfig;
        status: 'pending' | 'completed' | 'failed';
        result?: CrawlerResult;
        error?: Error;
      };
    }
  | { type: 'REMOVE_CRAWLER'; payload: string }
  | {
      type: 'UPDATE_CACHE_STATS';
      payload: {
        hits: number;
        misses: number;
        size: number;
      };
    };

const initialState: NetworkState = {
  activeRequests: new Map(),
  activeCrawlers: new Map(),
  cacheStats: {
    hits: 0,
    misses: 0,
    size: 0,
  },
  loading: false,
  error: null,
};

const NetworkContext = createContext<{
  state: NetworkState;
  dispatch: React.Dispatch<NetworkAction>;
  sendRequest: (config: RequestConfig) => Promise<string>;
  cancelRequest: (requestId: string) => Promise<void>;
  startCrawler: (config: CrawlerConfig) => Promise<string>;
  cancelCrawler: (crawlerId: string) => Promise<void>;
  clearCache: (pattern?: string) => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  sendRequest: async () => '',
  cancelRequest: async () => {},
  startCrawler: async () => '',
  cancelCrawler: async () => {},
  clearCache: async () => {},
});

const networkReducer = (
  state: NetworkState,
  action: NetworkAction
): NetworkState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REQUEST': {
      const newRequests = new Map(state.activeRequests);
      newRequests.set(action.payload.id, {
        config: action.payload.config,
        startTime: Date.now(),
        status: action.payload.status,
        response: action.payload.response,
        error: action.payload.error,
      });
      return { ...state, activeRequests: newRequests };
    }
    case 'REMOVE_REQUEST': {
      const newRequests = new Map(state.activeRequests);
      newRequests.delete(action.payload);
      return { ...state, activeRequests: newRequests };
    }
    case 'SET_CRAWLER': {
      const newCrawlers = new Map(state.activeCrawlers);
      newCrawlers.set(action.payload.id, {
        config: action.payload.config,
        startTime: Date.now(),
        status: action.payload.status,
        result: action.payload.result,
        error: action.payload.error,
      });
      return { ...state, activeCrawlers: newCrawlers };
    }
    case 'REMOVE_CRAWLER': {
      const newCrawlers = new Map(state.activeCrawlers);
      newCrawlers.delete(action.payload);
      return { ...state, activeCrawlers: newCrawlers };
    }
    case 'UPDATE_CACHE_STATS':
      return { ...state, cacheStats: action.payload };
    default:
      return state;
  }
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(networkReducer, initialState);

  useEffect(() => {
    const loadCacheStats = async () => {
      try {
        const stats = await networkService.getCacheStats();
        dispatch({
          type: 'UPDATE_CACHE_STATS',
          payload: {
            hits: stats.hits,
            misses: stats.misses,
            size: stats.size,
          },
        });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      }
    };

    loadCacheStats();
  }, []);

  const sendRequest = async (config: RequestConfig): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { requestId } = await networkService.sendRequest(config);

      dispatch({
        type: 'SET_REQUEST',
        payload: {
          id: requestId,
          config,
          status: 'pending',
        },
      });

      // 轮询请求结果
      const pollResult = async () => {
        try {
          const result = await networkService.getRequestResult(requestId);
          dispatch({
            type: 'SET_REQUEST',
            payload: {
              id: requestId,
              config,
              status: 'completed',
              response: result,
            },
          });
        } catch (error) {
          dispatch({
            type: 'SET_REQUEST',
            payload: {
              id: requestId,
              config,
              status: 'failed',
              error: error as Error,
            },
          });
        }
      };

      setTimeout(pollResult, 1000);
      return requestId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await networkService.cancelRequest(requestId);
      dispatch({ type: 'REMOVE_REQUEST', payload: requestId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startCrawler = async (config: CrawlerConfig): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { crawlerId } = await networkService.startCrawler(config);

      dispatch({
        type: 'SET_CRAWLER',
        payload: {
          id: crawlerId,
          config,
          status: 'pending',
        },
      });

      // 轮询爬虫结果
      const pollResult = async () => {
        try {
          const result = await networkService.getCrawlerResult(crawlerId);
          dispatch({
            type: 'SET_CRAWLER',
            payload: {
              id: crawlerId,
              config,
              status: 'completed',
              result,
            },
          });
        } catch (error) {
          dispatch({
            type: 'SET_CRAWLER',
            payload: {
              id: crawlerId,
              config,
              status: 'failed',
              error: error as Error,
            },
          });
        }
      };

      setTimeout(pollResult, 1000);
      return crawlerId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelCrawler = async (crawlerId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await networkService.cancelCrawler(crawlerId);
      dispatch({ type: 'REMOVE_CRAWLER', payload: crawlerId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCache = async (pattern?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await networkService.clearCache(pattern);
      const stats = await networkService.getCacheStats();
      dispatch({
        type: 'UPDATE_CACHE_STATS',
        payload: {
          hits: stats.hits,
          misses: stats.misses,
          size: stats.size,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        state,
        dispatch,
        sendRequest,
        cancelRequest,
        startCrawler,
        cancelCrawler,
        clearCache,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 