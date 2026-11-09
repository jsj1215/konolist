package com.konolist.backend.playlist.dto;

import jakarta.validation.constraints.Size;

public record UpdateMemoRequest(
        @Size(max = 100) String memo
) {}
