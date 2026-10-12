package com.argosquant.web.controller;

import com.argosquant.exceptions.ArgosException;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.portfolio.dto.TradeCommand;
import com.argosquant.portfolio.dto.TradeResult;
import com.argosquant.portfolio.dto.TransactionView;
import com.argosquant.portfolio.service.TransactionService;
import com.argosquant.web.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Buy/sell execution and transaction history for a portfolio. */
@RestController
@RequestMapping("/api/portfolios/{portfolioId}/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TradeResult execute(@PathVariable long portfolioId, @RequestBody TradeCommand command)
            throws ArgosException {
        return transactionService.execute(CurrentUser.userId(), portfolioId, command);
    }

    @GetMapping
    public List<TransactionView> history(@PathVariable long portfolioId) throws ResourceNotFoundException {
        return transactionService.historyView(CurrentUser.userId(), portfolioId);
    }
}
