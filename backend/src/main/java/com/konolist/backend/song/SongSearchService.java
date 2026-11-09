package com.konolist.backend.song;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.konolist.backend.song.dto.SongDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Locale;

/**
 * TJ 노래 검색. 같은 검색어는 일정 시간 서버 메모리에 보관해 TJ 사이트 호출을 줄임.
 *
 * 처음에는 Redis에 캐시했지만, 데모 배포가 Cloud Run 1대 구성이라 서버 메모리 캐시로도 충분함.
 * 관리할 외부 서비스가 하나 줄고, 로컬 실행에도 Redis가 필요 없어짐.
 * 대신 서버가 재시작되거나 인스턴스가 꺼지면 캐시가 비고, 여러 대로 늘리면 인스턴스마다 따로 캐시함.
 */
@Service
public class SongSearchService {

    private final TjCrawlerService crawlerService;
    private final Cache<String, List<SongDto>> cache;

    public SongSearchService(TjCrawlerService crawlerService,
                             @Value("${crawling.tj.cache-ttl-hours}") long cacheTtlHours,
                             @Value("${crawling.tj.cache-max-entries:1000}") long cacheMaxEntries) {
        this.crawlerService = crawlerService;
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(cacheTtlHours))
                .maximumSize(cacheMaxEntries)
                .build();
    }

    public List<SongDto> search(String query) {
        String key = query.strip().toLowerCase(Locale.ROOT);

        List<SongDto> cached = cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        List<SongDto> songs = crawlerService.search(query);
        // 결과가 없거나 크롤링이 실패한 경우는 캐시하지 않아 다음 요청에서 다시 시도함
        if (!songs.isEmpty()) {
            cache.put(key, List.copyOf(songs));
        }
        return songs;
    }
}
