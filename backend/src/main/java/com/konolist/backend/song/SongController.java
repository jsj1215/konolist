package com.konolist.backend.song;

import com.konolist.backend.song.dto.SongDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongSearchService songSearchService;

    // 클래스 레벨 @Validated 없이 Spring MVC 기본 메서드 검증을 사용 → 잘못된 q는 400
    @GetMapping("/search")
    public ResponseEntity<List<SongDto>> search(
            @RequestParam @NotBlank @Size(min = 1, max = 50) String q
    ) {
        return ResponseEntity.ok(songSearchService.search(q));
    }
}
