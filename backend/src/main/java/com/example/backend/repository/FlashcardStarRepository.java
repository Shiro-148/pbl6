package com.example.backend.repository;

import com.example.backend.model.FlashcardStar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlashcardStarRepository extends JpaRepository<FlashcardStar, Long> {
    List<FlashcardStar> findBySetId(Long setId);

    Optional<FlashcardStar> findBySetIdAndCardId(Long setId, Long cardId);

    void deleteBySetIdAndCardId(Long setId, Long cardId);
}
