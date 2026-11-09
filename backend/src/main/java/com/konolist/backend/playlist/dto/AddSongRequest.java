package com.konolist.backend.playlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 길이 제한은 PlaylistSong 컬럼 길이와 맞춤
public record AddSongRequest(
        @NotBlank @Size(max = 10) String tjNumber,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 100) String artist
) {}
