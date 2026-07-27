package com.polaris.mapper;

import com.polaris.dto.UserResponseDto;
import com.polaris.entity.User;

public class UserMapper {

    private UserMapper() {
    }

    public static UserResponseDto toDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setStatus(user.getStatus().name());
        dto.setXp(user.getXp());
        return dto;
    }
}
