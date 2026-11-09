package com.konolist.backend.playlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, Long> {
    Optional<PlaylistSong> findByIdAndPlaylistId(Long id, Long playlistId);

    @Query("SELECT COALESCE(MAX(ps.sortOrder), -1) FROM PlaylistSong ps WHERE ps.playlist.id = :playlistId")
    int findMaxSortOrderByPlaylistId(Long playlistId);

    boolean existsByPlaylistIdAndTjNumber(Long playlistId, String tjNumber);
}
