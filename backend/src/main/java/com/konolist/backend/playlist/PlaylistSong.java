package com.konolist.backend.playlist;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "playlist_songs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaylistSong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private Playlist playlist;

    @Column(nullable = false, length = 10)
    private String tjNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String artist;

    @Column(length = 100)
    private String memo;

    @Column(length = 500)
    private String recordingPath;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public PlaylistSong(Playlist playlist, String tjNumber, String title, String artist, int sortOrder) {
        this.playlist = playlist;
        this.tjNumber = tjNumber;
        this.title = title;
        this.artist = artist;
        this.sortOrder = sortOrder;
    }

    public void updateMemo(String memo) {
        this.memo = memo;
    }

    public void updateRecordingPath(String path) {
        this.recordingPath = path;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
