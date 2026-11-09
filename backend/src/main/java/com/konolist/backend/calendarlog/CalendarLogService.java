package com.konolist.backend.calendarlog;

import com.konolist.backend.calendarlog.dto.CalendarLogDto;
import com.konolist.backend.calendarlog.dto.CreateLogRequest;
import com.konolist.backend.playlist.Playlist;
import com.konolist.backend.playlist.PlaylistRepository;
import com.konolist.backend.user.User;
import com.konolist.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarLogService {

    private final CalendarLogRepository logRepository;
    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;

    /** 특정 날짜의 로그 목록 */
    @Transactional(readOnly = true)
    public List<CalendarLogDto> getLogsByDate(String email, LocalDate date) {
        User user = getUser(email);
        return logRepository
                .findByUserIdAndDateBetweenOrderByDateAsc(user.getId(), date, date)
                .stream().map(CalendarLogDto::from).toList();
    }

    /** 월별 로그가 있는 날짜 목록 (캘린더 dot 표시용) */
    @Transactional(readOnly = true)
    public List<LocalDate> getLogDates(String email, int year, int month) {
        User user = getUser(email);
        return logRepository.findLogDatesByUserAndYearMonth(user.getId(), year, month);
    }

    @Transactional
    public CalendarLogDto create(String email, CreateLogRequest req) {
        User user = getUser(email);
        Playlist playlist = playlistRepository.findById(req.playlistId())
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

        CalendarLog log = CalendarLog.builder()
                .user(user)
                .date(req.date())
                .playlist(playlist)
                .build();
        return CalendarLogDto.from(logRepository.save(log));
    }

    @Transactional
    public void delete(String email, Long logId) {
        User user = getUser(email);
        CalendarLog log = logRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));
        if (!log.getUser().getId().equals(user.getId())) {
            throw new SecurityException("권한이 없습니다.");
        }
        logRepository.delete(log);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
    }
}
