package com.example.backend.config;

import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtAuthenticationFilter;
import com.example.backend.security.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import java.util.Collections;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // register JWT filter
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtUtil, userRepository);

        http
                .csrf().disable()
                .cors()
                .and()
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/h2-console/**",
                                "/api/flashcards/ai-word", "/api/flashcards/enrich")
                        .permitAll()
                        // allow all CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sets/public", "/api/sets/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sets/*").permitAll()
                        // allow starring/un-starring public sets without forcing login
                        .requestMatchers(HttpMethod.POST, "/api/sets/*/cards/*/star").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/sets/*/cards/*/star").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/games/**").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // allow H2 console frames
                .headers(headers -> headers.frameOptions().disable());

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return identifier -> {
            return userRepository.findByUsername(identifier)
                    .or(() -> userRepository.findByEmail(identifier))
                    .map(u -> org.springframework.security.core.userdetails.User.withUsername(u.getUsername())
                            .password(u.getPassword()).authorities(Collections.emptyList()).build())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        };
    }

    // inject UserRepository and JwtUtil for building filter and userDetailsService
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public SecurityConfig(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }
}
