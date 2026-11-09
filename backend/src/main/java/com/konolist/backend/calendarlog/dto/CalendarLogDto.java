package com.konolist.backend.calendarlog.dto;

import com.konolist.backend.calendarlog.CalendarLog;

import java.time.LocalDate;

public record CalendarLogDto(
        Long id,
        LocalDate date,
        Long playlistId,
        String playlistTitle,
        int songCount
) {
    public static CalendarLogDto from(CalendarLog log) {
        return new CalendarLogDto(
                log.getId(),
                log.getDate(),
                log.getPlaylist().getId(),
                log.getPlaylist().getTitle(),
                log.getPlaylist().getSongs().size()
        );
    }
}
