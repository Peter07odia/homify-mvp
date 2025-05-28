import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager, PerformanceObserver } from 'react-native';

interface PerformanceMetrics {
  screenTransitionTime: number;
  componentRenderTime: number;
  memoryUsage: number;
  bundleLoadTime: number;
}

interface PerformanceConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  sampleRate?: number;
}

export const usePerformanceMonitor = (
  screenName: string,
  config: PerformanceConfig = {}
) => {
  const {
    enableLogging = __DEV__,
    enableMetrics = true,
    sampleRate = 1.0,
  } = config;

  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  // Track screen transition time
  const trackScreenTransition = useCallback(() => {
    const transitionTime = Date.now() - startTime.current;
    metricsRef.current.screenTransitionTime = transitionTime;

    if (enableLogging) {
      console.log(`📊 Screen Transition [${screenName}]: ${transitionTime}ms`);
    }

    return transitionTime;
  }, [screenName, enableLogging]);

  // Track component render time
  const trackRenderTime = useCallback((componentName?: string) => {
    const renderTime = Date.now() - renderStartTime.current;
    metricsRef.current.componentRenderTime = renderTime;

    if (enableLogging) {
      const name = componentName || screenName;
      console.log(`🎨 Render Time [${name}]: ${renderTime}ms`);
    }

    return renderTime;
  }, [screenName, enableLogging]);

  // Track memory usage (iOS only)
  const trackMemoryUsage = useCallback(() => {
    if (enableMetrics && Math.random() <= sampleRate) {
      // Note: This is a simplified memory tracking
      // In production, you'd use a more sophisticated solution
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        metricsRef.current.memoryUsage = usedMemory;

        if (enableLogging) {
          console.log(`💾 Memory Usage [${screenName}]: ${usedMemory.toFixed(2)}MB`);
        }

        return usedMemory;
      }
    }
    return 0;
  }, [screenName, enableLogging, enableMetrics, sampleRate]);

  // Track bundle load time
  const trackBundleLoadTime = useCallback(() => {
    const loadTime = Date.now() - startTime.current;
    metricsRef.current.bundleLoadTime = loadTime;

    if (enableLogging) {
      console.log(`📦 Bundle Load [${screenName}]: ${loadTime}ms`);
    }

    return loadTime;
  }, [screenName, enableLogging]);

  // Performance mark for profiling
  const markPerformance = useCallback((markName: string) => {
    if (enableMetrics) {
      try {
        performance.mark(`${screenName}-${markName}`);
        if (enableLogging) {
          console.log(`🏷️ Performance Mark: ${screenName}-${markName}`);
        }
      } catch (error) {
        // Performance API might not be available
        if (enableLogging) {
          console.warn('Performance API not available');
        }
      }
    }
  }, [screenName, enableLogging, enableMetrics]);

  // Measure performance between two marks
  const measurePerformance = useCallback((
    measureName: string,
    startMark: string,
    endMark: string
  ) => {
    if (enableMetrics) {
      try {
        performance.measure(
          `${screenName}-${measureName}`,
          `${screenName}-${startMark}`,
          `${screenName}-${endMark}`
        );
        
        const measure = performance.getEntriesByName(`${screenName}-${measureName}`)[0];
        if (measure && enableLogging) {
          console.log(`📏 Performance Measure [${measureName}]: ${measure.duration.toFixed(2)}ms`);
        }
        
        return measure?.duration || 0;
      } catch (error) {
        if (enableLogging) {
          console.warn('Performance measurement failed:', error);
        }
        return 0;
      }
    }
    return 0;
  }, [screenName, enableLogging, enableMetrics]);

  // Log performance summary
  const logPerformanceSummary = useCallback(() => {
    if (enableLogging && enableMetrics) {
      console.group(`📊 Performance Summary [${screenName}]`);
      console.log('Screen Transition:', metricsRef.current.screenTransitionTime, 'ms');
      console.log('Component Render:', metricsRef.current.componentRenderTime, 'ms');
      console.log('Memory Usage:', metricsRef.current.memoryUsage, 'MB');
      console.log('Bundle Load:', metricsRef.current.bundleLoadTime, 'ms');
      console.groupEnd();
    }
  }, [screenName, enableLogging, enableMetrics]);

  // Initialize performance tracking
  useEffect(() => {
    if (enableMetrics) {
      startTime.current = Date.now();
      renderStartTime.current = Date.now();
      
      markPerformance('screen-start');
      
      // Track when interactions are complete
      const interactionHandle = InteractionManager.runAfterInteractions(() => {
        trackScreenTransition();
        markPerformance('interactions-complete');
      });

      return () => {
        interactionHandle.cancel();
        markPerformance('screen-end');
        logPerformanceSummary();
      };
    }
  }, [
    enableMetrics,
    trackScreenTransition,
    markPerformance,
    logPerformanceSummary,
  ]);

  // Track render completion
  useEffect(() => {
    if (enableMetrics) {
      const timer = setTimeout(() => {
        trackRenderTime();
        trackMemoryUsage();
        markPerformance('render-complete');
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [enableMetrics, trackRenderTime, trackMemoryUsage, markPerformance]);

  return {
    trackScreenTransition,
    trackRenderTime,
    trackMemoryUsage,
    trackBundleLoadTime,
    markPerformance,
    measurePerformance,
    logPerformanceSummary,
    metrics: metricsRef.current,
  };
};

// Hook for tracking component-specific performance
export const useComponentPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (__DEV__) {
      console.log(
        `🔄 Component Render [${componentName}]: #${renderCount.current} (${timeSinceLastRender}ms since last)`
      );
    }
  });

  return {
    renderCount: renderCount.current,
  };
};

export default usePerformanceMonitor; 