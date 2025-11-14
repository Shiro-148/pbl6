package com.example.backend.repository;

import com.example.backend.model.Folder;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUser(User user);
    List<Folder> findByUserId(Long userId);
}
