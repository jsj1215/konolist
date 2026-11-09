package com.konolist.backend.song;

import com.konolist.backend.song.dto.SongDto;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class TjCrawlerService {

    @Value("${crawling.tj.base-url}")
    private String baseUrl;

    private static final String SEARCH_PATH =
            "/song/accompaniment_search?nationType=&strType=0&searchTxt=%s&pageNo=1&pageRowCnt=20";

    public List<SongDto> search(String query) {
        String url = baseUrl + String.format(SEARCH_PATH,
                java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8));

        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                    .header("Referer", baseUrl + "/song/accompaniment")
                    .timeout(8_000)
                    .get();

            return parseSongs(doc);
        } catch (IOException e) {
            log.error("TJ 크롤링 실패: query={}, error={}", query, e.getMessage());
            return List.of();
        }
    }

    private List<SongDto> parseSongs(Document doc) {
        List<SongDto> songs = new ArrayList<>();
        java.util.Set<String> seen = new java.util.LinkedHashSet<>();

        Elements items = doc.select("ul.grid-container.list");

        for (Element item : items) {
            String tjNumber = item.select(".num2").text().trim();
            String title    = item.select(".grid-item.title3 p span").text().trim();
            String artist   = item.select(".grid-item.title4.singer p span").text().trim();

            if (tjNumber.isEmpty() || title.isEmpty()) continue;
            if (!seen.add(tjNumber)) continue;

            songs.add(new SongDto(tjNumber, title, artist));
        }

        return songs;
    }
}
