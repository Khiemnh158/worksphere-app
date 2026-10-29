package com.worksphere.shared.response;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Standard pagination response wrapper per API Contract section 5.3.
 */
public record PagedData<T>(
        List<T> items,
        int page,
        int size,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
    public static <T> PagedData<T> from(Page<T> springPage) {
        return new PagedData<>(
                springPage.getContent(),
                springPage.getNumber(),
                springPage.getSize(),
                springPage.getTotalElements(),
                springPage.getTotalPages(),
                springPage.hasNext(),
                springPage.hasPrevious()
        );
    }

    public static <T, R> PagedData<R> from(Page<T> springPage, List<R> transformedItems) {
        return new PagedData<>(
                transformedItems,
                springPage.getNumber(),
                springPage.getSize(),
                springPage.getTotalElements(),
                springPage.getTotalPages(),
                springPage.hasNext(),
                springPage.hasPrevious()
        );
    }
}
