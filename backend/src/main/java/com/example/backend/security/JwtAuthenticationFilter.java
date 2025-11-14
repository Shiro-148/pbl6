package com.example.backend.security;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepo;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepo) {
        this.jwtUtil = jwtUtil;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(header)) {
            log.debug("No Authorization header present for request {} {}", request.getMethod(),
                    request.getRequestURI());
        } else if (!header.startsWith("Bearer ")) {
            log.debug("Authorization header does not use Bearer scheme: {}", header);
        } else {
            String token = header.substring(7);
            try {
                boolean valid = jwtUtil.validateToken(token);
                if (!valid) {
                    log.debug("JWT validation failed for token: {}... (first 8 chars)",
                            token.length() > 8 ? token.substring(0, 8) : token);
                } else {
                    String username = jwtUtil.extractUsername(token);
                    if (username == null) {
                        log.debug("JWT validated but username extraction returned null");
                    } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
                        log.debug("SecurityContext already contains authentication for request");
                    } else {
                        User u = userRepo.findByUsername(username).orElse(null);
                        if (u == null) {
                            log.debug("User from token not found in DB: {}", username);
                        } else {
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    u.getUsername(), null, Collections.emptyList());
                            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(auth);
                            log.debug("Authenticated request as {}", username);
                        }
                    }
                }
            } catch (Exception ex) {
                log.debug("Exception validating JWT: {}", ex.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
