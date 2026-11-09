package com.konolist.backend.song;

import com.konolist.backend.song.dto.SongDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SongSearchServiceTest {

    private TjCrawlerService crawler;
    private SongSearchService service;

    @BeforeEach
    void setUp() {
        crawler = mock(TjCrawlerService.class);
        service = new SongSearchService(crawler, 1, 1000);
    }

    @Test
    void sameQueryIsServedFromCacheWithoutCallingTjAgain() {
        List<SongDto> result = List.of(mock(SongDto.class));
        when(crawler.search(anyString())).thenReturn(result);

        service.search("아이유");
        List<SongDto> second = service.search("아이유");

        assertThat(second).hasSize(1);
        verify(crawler, times(1)).search(anyString());
    }

    @Test
    void cacheKeyIgnoresCaseAndSurroundingSpaces() {
        when(crawler.search(anyString())).thenReturn(List.of(mock(SongDto.class)));

        service.search("Hype Boy");
        service.search("  hype boy ");

        verify(crawler, times(1)).search(anyString());
    }

    @Test
    void emptyResultIsNotCachedSoNextRequestRetries() {
        when(crawler.search(anyString())).thenReturn(List.of());

        service.search("없는노래");
        service.search("없는노래");

        verify(crawler, times(2)).search(anyString());
    }
}
