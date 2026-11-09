package com.konolist.backend.playlist.dto;

import java.util.List;

public record ReorderRequest(List<Long> songIds) {}
