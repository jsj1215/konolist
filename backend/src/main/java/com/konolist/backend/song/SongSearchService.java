package com.konolist.backend.song;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.konolist.backend.song.dto.SongDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SongSearchService {

    private final TjCrawlerService crawlerService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${crawling.tj.cache-ttl-hours}")
    private long cacheTtlHours;

    private static final String CACHE_PREFIX = "song:search:";

    public List<SongDto> search(String query) {
        String cacheKey = CACHE_PREFIX + query.toLowerCase().strip();

        // 1. Redis 캐시 조회
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("캐시 역직렬화 실패, 재크롤링: {}", e.getMessage());
            }
        }

        // 2. 캐시 미스 → TJ 크롤링
        List<SongDto> songs = crawlerService.search(query);

        // 3. 결과 캐시 저장
        if (!songs.isEmpty()) {
            try {
                String json = objectMapper.writeValueAsString(songs);
                redisTemplate.opsForValue().set(cacheKey, json, Duration.ofHours(cacheTtlHours));
            } catch (Exception e) {
                log.warn("캐시 저장 실패: {}", e.getMessage());
            }
        }

        return songs;
    }
}
