package com.argosquant.web.controller;

import com.argosquant.exceptions.DuplicateResourceException;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.model.Holding;
import com.argosquant.model.Portfolio;
import com.argosquant.portfolio.service.PortfolioService;
import com.argosquant.web.dto.CreatePortfolioRequest;
import com.argosquant.web.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Portfolio CRUD, scoped to the authenticated user. */
@RestController
@RequestMapping("/api/portfolios")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Portfolio create(@RequestBody CreatePortfolioRequest request) throws DuplicateResourceException {
        return portfolioService.create(CurrentUser.userId(), request.name(), request.baseCurrency());
    }

    @GetMapping
    public List<Portfolio> list() {
        return portfolioService.list(CurrentUser.userId());
    }

    @GetMapping("/{id}")
    public Portfolio get(@PathVariable long id) throws ResourceNotFoundException {
        return portfolioService.get(CurrentUser.userId(), id);
    }

    @GetMapping("/{id}/holdings")
    public List<Holding> holdings(@PathVariable long id) throws ResourceNotFoundException {
        return portfolioService.listHoldings(CurrentUser.userId(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) throws ResourceNotFoundException {
        portfolioService.delete(CurrentUser.userId(), id);
    }
}
