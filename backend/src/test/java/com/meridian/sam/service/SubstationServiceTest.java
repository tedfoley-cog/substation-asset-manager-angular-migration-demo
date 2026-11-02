package com.meridian.sam.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class SubstationServiceTest {
    @Autowired SubstationService service;

    @Test
    void iedCountsAggregatesPerSubstationAndZeroFillsUnknownIds() {
        Map<Long, Long> counts = service.iedCounts(List.of(1L, 3L, 9999L));
        assertThat(counts).containsExactlyInAnyOrderEntriesOf(Map.of(1L, 5L, 3L, 4L, 9999L, 0L));
        assertThat(service.iedCounts(List.of())).isEmpty();
    }

    @Test
    void iedCountMatchesAggregate() {
        assertThat(service.iedCount(1L)).isEqualTo(5L);
    }

    @Test
    void iedCountOfMissingSubstationThrowsNotFound() {
        assertThatThrownBy(() -> service.iedCount(9999L))
            .isInstanceOf(NotFoundException.class)
            .hasMessage("Substation 9999 not found");
    }
}
