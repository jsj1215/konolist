package com.konolist.backend.playlist.dto;

import com.konolist.backend.playlist.PlaylistSong;

public record PlaylistSongDto(
        Long id,
        String tjNumber,
        String title,
        String artist,
        String memo,
        int sortOrder,
        boolean hasRecording
) {
    public static PlaylistSongDto from(PlaylistSong ps) {
        return new PlaylistSongDto(
                ps.getId(),
                ps.getTjNumber(),
                ps.getTitle(),
                ps.getArtist(),
                ps.getMemo(),
                ps.getSortOrder(),
                ps.getRecordingPath() != null
        );
    }
}
