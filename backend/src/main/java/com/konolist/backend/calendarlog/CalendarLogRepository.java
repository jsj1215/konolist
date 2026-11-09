package com.konolist.backend.calendarlog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface CalendarLogRepository extends JpaRepository<CalendarLog, Long> {

    List<CalendarLog> findByUserIdAndDateBetweenOrderByDateAsc(
            Long userId, LocalDate start, LocalDate end);

    @Query("SELECT DISTINCT cl.date FROM CalendarLog cl " +
           "WHERE cl.user.id = :userId AND YEAR(cl.date) = :year AND MONTH(cl.date) = :month")
    List<LocalDate> findLogDatesByUserAndYearMonth(Long userId, int year, int month);

    // 플레이리스트 삭제 전 FK 위반을 막기 위해 연결된 기록을 먼저 삭제
    @Modifying
    @Query("DELETE FROM CalendarLog cl WHERE cl.playlist.id = :playlistId")
    void deleteByPlaylistId(Long playlistId);
}
