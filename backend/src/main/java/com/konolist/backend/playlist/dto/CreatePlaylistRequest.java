package com.konolist.backend.playlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlaylistRequest(
        @NotBlank @Size(max = 50) String title,
        @Size(max = 200) String description
) {}
