import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VirtualChatListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  onLoadMore?: () => void;
}

/**
 * Virtual scrolling component for chat messages
 * Only renders visible items + overscan for performance
 */
export function VirtualChatList<T extends { id: string | number }>({
  items,
  renderItem,
  itemHeight = 150, // Approximate height per message
  overscan = 3, // Number of items to render outside viewport
  className = '',
  onLoadMore,
}: VirtualChatListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate which items are visible
  const { visibleItems, totalHeight, offsetY } = useVirtualization(
    items,
    itemHeight,
    scrollTop,
    containerHeight,
    overscan
  );

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Load more when scrolled to top (for infinite scroll)
    if (target.scrollTop < 100 && onLoadMore) {
      onLoadMore();
    }
  }, [onLoadMore]);

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Auto-scroll to bottom on new messages (optional)
  useEffect(() => {
    if (containerRef.current && items.length > 0) {
      const isNearBottom =
        scrollTop + containerHeight >= totalHeight - itemHeight * 2;

      if (isNearBottom) {
        containerRef.current.scrollTop = totalHeight;
      }
    }
  }, [items.length, totalHeight, scrollTop, containerHeight, itemHeight]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto custom-scrollbar ${className}`}
      onScroll={handleScroll}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, idx) => (
            <div key={item.id} data-index={idx}>
              {renderItem(item, idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for virtualization calculations
 */
function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  scrollTop: number,
  containerHeight: number,
  overscan: number
) {
  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan
  );

  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
  };
}

/**
 * Simple non-virtual chat list for small message counts
 * Used when message count is below threshold
 */
export function SimpleChatList<T extends { id: string | number }>({
  items,
  renderItem,
  className = '',
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {items.map((item, idx) => (
        <div key={item.id}>{renderItem(item, idx)}</div>
      ))}
    </div>
  );
}

/**
 * Smart chat list that switches between virtual and simple based on item count
 */
export function SmartChatList<T extends { id: string | number }>({
  items,
  renderItem,
  virtualThreshold = 50,
  className = '',
  ...props
}: VirtualChatListProps<T> & { virtualThreshold?: number }) {
  const shouldVirtualize = items.length > virtualThreshold;

  if (shouldVirtualize) {
    return (
      <VirtualChatList
        items={items}
        renderItem={renderItem}
        className={className}
        {...props}
      />
    );
  }

  return (
    <SimpleChatList
      items={items}
      renderItem={renderItem}
      className={className}
    />
  );
}