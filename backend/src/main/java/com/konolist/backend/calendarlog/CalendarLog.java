package com.konolist.backend.calendarlog;

import com.konolist.backend.playlist.Playlist;
import com.konolist.backend.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_logs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date", "playlist_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CalendarLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public CalendarLog(User user, LocalDate date, Playlist playlist) {
        this.user = user;
        this.date = date;
        this.playlist = playlist;
    }
}
