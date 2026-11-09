package com.konolist.backend.calendarlog.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateLogRequest(
        @NotNull LocalDate date,
        @NotNull Long playlistId
) {}
