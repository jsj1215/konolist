package com.konolist.backend.playlist.dto;

import jakarta.validation.constraints.Size;

public record UpdatePlaylistRequest(
        @Size(max = 50) String title,
        @Size(max = 200) String description,
        Boolean isPublic
) {}
