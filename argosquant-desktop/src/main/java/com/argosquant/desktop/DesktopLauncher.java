package com.argosquant.desktop;

import com.argosquant.dashboard.DashboardHolding;
import com.argosquant.dashboard.PortfolioDashboard;
import com.argosquant.desktop.ApiClient.PortfolioRef;
import com.argosquant.desktop.ApiClient.QuoteView;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.Tab;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TabPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Callable;
import java.util.function.Consumer;

/**
 * ArgosQuant JavaFX desktop client — the second client on the shared REST
 * backend (the other being the React web app). It is a <b>read-only analytics
 * viewer</b>: the user signs in with the same account they use on the web app
 * and sees their live portfolio, looks up market quotes, and views their
 * watchlist. It never places trades (that stays with the web client).
 *
 * <p>All network I/O runs off the FX application thread via {@link #runAsync};
 * results are marshalled back with {@link Platform#runLater}.
 */
public final class DesktopLauncher extends Application {

    private static final String BASE_URL = "http://localhost:8080/api";
    private static final DateTimeFormatter AS_OF =
            DateTimeFormatter.ofPattern("dd MMM, HH:mm").withZone(ZoneId.of("Asia/Kolkata"));

    // palette (kept in sync with desktop.css)
    private static final String BG = "#0b0d12";
    private static final String PANEL = "#1d212b";
    private static final String TEXT = "#f4f6fb";
    private static final String MUTED = "#97a0b5";
    private static final String GREEN = "#3fcf8e";
    private static final String RED = "#ff6b6b";

    private final ApiClient api = new ApiClient(BASE_URL);
    private Stage stage;

    // dashboard widgets
    private ComboBox<PortfolioRef> portfolioPicker;
    private Label tileValue, tileCost, tilePnl, tilePositions;
    private final TableView<DashboardHolding> holdingsTable = new TableView<>();

    // market widgets
    private TextField marketSymbol;
    private Label marketPrice, marketMeta;

    // watchlist widgets
    private final TableView<QuoteView> watchTable = new TableView<>();
    private TextField watchSymbol;

    private Label mainStatus;

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        this.stage = primaryStage;
        stage.setTitle("ArgosQuant Desktop");
        showLogin();
        stage.show();
    }

    /* =============================== login =============================== */

    private void showLogin() {
        Label title = new Label("ArgosQuant");
        title.setStyle("-fx-font-size: 26px; -fx-font-weight: bold; -fx-text-fill: " + TEXT + ";");
        Label subtitle = new Label("Desktop Client · shared REST backend on :8080");
        subtitle.setStyle("-fx-font-size: 12px; -fx-text-fill: " + MUTED + ";");

        Label health = new Label("Checking backend…");
        health.setStyle("-fx-font-size: 12px; -fx-text-fill: " + MUTED + ";");

        TextField email = new TextField();
        email.setPromptText("Email");
        PasswordField password = new PasswordField();
        password.setPromptText("Password");
        TextField displayName = new TextField();
        displayName.setPromptText("Display name (only to create a new account)");

        Label error = new Label();
        error.setStyle("-fx-text-fill: " + RED + "; -fx-font-size: 12px;");
        error.setWrapText(true);
        error.setMaxWidth(320);

        Button signIn = new Button("Sign in");
        signIn.getStyleClass().add("primary");
        signIn.setDefaultButton(true);
        Button register = new Button("Register");
        HBox actions = new HBox(10, signIn, register);
        actions.setAlignment(Pos.CENTER);

        Runnable doLogin = () -> {
            error.setText("");
            String e = email.getText().trim();
            String p = password.getText();
            if (e.isEmpty() || p.isEmpty()) {
                error.setText("Enter an email and password.");
                return;
            }
            setDisabled(true, signIn, register);
            runAsync(() -> {
                api.login(e, p);
                return null;
            }, v -> showMain(), msg -> {
                error.setText(msg);
                setDisabled(false, signIn, register);
            });
        };

        Runnable doRegister = () -> {
            error.setText("");
            String e = email.getText().trim();
            String p = password.getText();
            String name = displayName.getText().trim();
            if (e.isEmpty() || p.isEmpty() || name.isEmpty()) {
                error.setText("To register, enter email, password and a display name.");
                return;
            }
            setDisabled(true, signIn, register);
            runAsync(() -> {
                api.register(e, name, p);
                return null;
            }, v -> showMain(), msg -> {
                error.setText(msg);
                setDisabled(false, signIn, register);
            });
        };

        signIn.setOnAction(ev -> doLogin.run());
        register.setOnAction(ev -> doRegister.run());
        password.setOnAction(ev -> doLogin.run());

        VBox card = new VBox(12, title, subtitle, health,
                spacer(6), email, password, displayName, error, actions);
        card.setAlignment(Pos.CENTER_LEFT);
        card.setMaxWidth(360);
        card.setPadding(new Insets(28));
        card.setStyle("-fx-background-color: " + PANEL + "; -fx-background-radius: 12;");

        VBox root = new VBox(card);
        root.setAlignment(Pos.CENTER);
        root.setStyle("-fx-background-color: " + BG + ";");
        root.setPadding(new Insets(24));

        Scene scene = new Scene(root, 480, 520);
        applyStylesheet(scene);
        stage.setScene(scene);

        // async health banner
        runAsync(api::health,
                s -> health.setText("Backend " + s),
                msg -> health.setText("Backend unreachable — " + msg));
    }

    /* ================================ main =============================== */

    private void showMain() {
        Label brand = new Label("ArgosQuant");
        brand.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: " + TEXT + ";");
        mainStatus = new Label("");
        mainStatus.setStyle("-fx-text-fill: " + MUTED + "; -fx-font-size: 12px;");
        Region gap = new Region();
        HBox.setHgrow(gap, Priority.ALWAYS);
        Button signOut = new Button("Sign out");
        signOut.setOnAction(ev -> {
            api.clearToken();
            showLogin();
        });
        HBox header = new HBox(12, brand, mainStatus, gap, signOut);
        header.setAlignment(Pos.CENTER_LEFT);
        header.setPadding(new Insets(12, 16, 12, 16));
        header.setStyle("-fx-background-color: " + PANEL + ";");

        TabPane tabs = new TabPane();
        tabs.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        tabs.getTabs().addAll(
                new Tab("Dashboard", buildDashboardTab()),
                new Tab("Market", buildMarketTab()),
                new Tab("Watchlist", buildWatchlistTab()));

        BorderPane root = new BorderPane();
        root.setTop(header);
        root.setCenter(tabs);
        root.setStyle("-fx-background-color: " + BG + ";");

        Scene scene = new Scene(root, 980, 660);
        applyStylesheet(scene);
        stage.setScene(scene);
        stage.centerOnScreen();

        loadPortfolios();
        loadWatchlist();
    }

    /* ---------------------------- dashboard tab -------------------------- */

    private Region buildDashboardTab() {
        portfolioPicker = new ComboBox<>();
        portfolioPicker.setPrefWidth(280);
        portfolioPicker.getSelectionModel().selectedItemProperty().addListener((obs, old, sel) -> {
            if (sel != null) {
                loadDashboard(sel.id());
            }
        });
        Button refresh = new Button("Refresh");
        refresh.setOnAction(ev -> {
            PortfolioRef sel = portfolioPicker.getValue();
            if (sel != null) {
                loadDashboard(sel.id());
            }
        });
        HBox controls = new HBox(10, label("Portfolio", MUTED), portfolioPicker, refresh);
        controls.setAlignment(Pos.CENTER_LEFT);

        tileValue = new Label("—");
        tileCost = new Label("—");
        tilePnl = new Label("—");
        tilePositions = new Label("—");
        HBox tiles = new HBox(12,
                tile("Total value", tileValue),
                tile("Total cost", tileCost),
                tile("Unrealised P&L", tilePnl),
                tile("Positions", tilePositions));

        buildHoldingsColumns();
        holdingsTable.setPlaceholder(new Label("No holdings yet — add trades in the web app."));
        VBox.setVgrow(holdingsTable, Priority.ALWAYS);

        VBox box = new VBox(14, controls, tiles, holdingsTable);
        box.setPadding(new Insets(16));
        box.setStyle("-fx-background-color: " + BG + ";");
        return box;
    }

    private void buildHoldingsColumns() {
        holdingsTable.getColumns().setAll(
                textCol("Symbol", 90, h -> h.symbol()),
                textCol("Name", 150, h -> h.name()),
                textCol("Qty", 70, h -> plain(h.quantity())),
                textCol("Avg cost", 100, h -> money(h.avgCost())),
                textCol("LTP", 100, h -> money(h.currentPrice())),
                textCol("Mkt value", 120, h -> money(h.marketValue())),
                textCol("P&L", 120, h -> money(h.unrealizedPnl())),
                textCol("P&L %", 90, h -> signedPct(h.unrealizedPnlPct())),
                textCol("Weight", 80, h -> pct(h.weight())));
    }

    private void loadPortfolios() {
        status("Loading portfolios…");
        runAsync(api::portfolios, list -> {
            portfolioPicker.setItems(FXCollections.observableArrayList(list));
            if (!list.isEmpty()) {
                portfolioPicker.getSelectionModel().selectFirst();
            } else {
                status("No portfolios on this account yet.");
            }
        }, this::status);
    }

    private void loadDashboard(long portfolioId) {
        status("Loading dashboard…");
        runAsync(() -> api.dashboard(portfolioId), this::renderDashboard, this::status);
    }

    private void renderDashboard(PortfolioDashboard d) {
        tileValue.setText(money(d.totalValue()));
        tileCost.setText(money(d.totalCost()));
        boolean up = d.totalPnl() == null || d.totalPnl().signum() >= 0;
        tilePnl.setText(money(d.totalPnl()) + "  (" + signedPct(d.totalPnlPct()) + ")");
        tilePnl.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: " + (up ? GREEN : RED) + ";");
        tilePositions.setText(String.valueOf(d.positions()));
        holdingsTable.setItems(FXCollections.observableArrayList(d.holdings()));
        status("Showing “" + d.name() + "” · valued at live market prices.");
    }

    /* ----------------------------- market tab --------------------------- */

    private Region buildMarketTab() {
        marketSymbol = new TextField();
        marketSymbol.setPromptText("e.g. RELIANCE");
        marketSymbol.setPrefWidth(220);
        Button getQuote = new Button("Get quote");
        getQuote.getStyleClass().add("primary");
        getQuote.setOnAction(ev -> fetchQuote());
        marketSymbol.setOnAction(ev -> fetchQuote());
        HBox controls = new HBox(10, label("Symbol", MUTED), marketSymbol, getQuote);
        controls.setAlignment(Pos.CENTER_LEFT);

        marketPrice = new Label("—");
        marketPrice.setStyle("-fx-font-size: 34px; -fx-font-weight: bold; -fx-text-fill: " + TEXT + ";");
        marketMeta = new Label("Enter an NSE symbol and fetch its live quote.");
        marketMeta.setStyle("-fx-text-fill: " + MUTED + ";");
        VBox resultCard = new VBox(8, marketPrice, marketMeta);
        resultCard.setPadding(new Insets(24));
        resultCard.setMaxWidth(Double.MAX_VALUE);
        resultCard.setStyle("-fx-background-color: " + PANEL + "; -fx-background-radius: 12;");

        VBox box = new VBox(16, controls, resultCard);
        box.setPadding(new Insets(16));
        box.setStyle("-fx-background-color: " + BG + ";");
        return box;
    }

    private void fetchQuote() {
        String sym = marketSymbol.getText().trim();
        if (sym.isEmpty()) {
            return;
        }
        marketMeta.setText("Fetching…");
        runAsync(() -> api.quote(sym), q -> {
            marketPrice.setText(formatMoney(q.price(), q.currency()));
            marketMeta.setText(q.symbol() + "  ·  as of " + formatAsOf(q.asOf()));
        }, msg -> {
            marketPrice.setText("—");
            marketMeta.setText(msg);
        });
    }

    /* ---------------------------- watchlist tab ------------------------- */

    private Region buildWatchlistTab() {
        watchSymbol = new TextField();
        watchSymbol.setPromptText("Add symbol, e.g. INFY");
        watchSymbol.setPrefWidth(200);
        Button add = new Button("Add");
        add.getStyleClass().add("primary");
        add.setOnAction(ev -> addWatch());
        watchSymbol.setOnAction(ev -> addWatch());
        Button remove = new Button("Remove selected");
        remove.getStyleClass().add("danger");
        remove.setOnAction(ev -> removeWatch());
        Button refresh = new Button("Refresh");
        refresh.setOnAction(ev -> loadWatchlist());
        Region gap = new Region();
        HBox.setHgrow(gap, Priority.ALWAYS);
        HBox controls = new HBox(10, watchSymbol, add, remove, gap, refresh);
        controls.setAlignment(Pos.CENTER_LEFT);

        watchTable.getColumns().setAll(
                watchCol("Symbol", 140, q -> q.symbol()),
                watchCol("Price", 160, q -> formatMoney(q.price(), q.currency())),
                watchCol("Currency", 100, q -> q.currency()),
                watchCol("As of", 180, q -> formatAsOf(q.asOf())));
        watchTable.setPlaceholder(new Label("Your watchlist is empty — add a symbol above."));
        VBox.setVgrow(watchTable, Priority.ALWAYS);

        VBox box = new VBox(14, controls, watchTable);
        box.setPadding(new Insets(16));
        box.setStyle("-fx-background-color: " + BG + ";");
        return box;
    }

    private void loadWatchlist() {
        runAsync(api::watchlistQuotes,
                list -> watchTable.setItems(FXCollections.observableArrayList(list)),
                this::status);
    }

    private void addWatch() {
        String sym = watchSymbol.getText().trim();
        if (sym.isEmpty()) {
            return;
        }
        runAsync(() -> {
            api.addToWatchlist(sym);
            return null;
        }, v -> {
            watchSymbol.clear();
            loadWatchlist();
        }, this::status);
    }

    private void removeWatch() {
        QuoteView sel = watchTable.getSelectionModel().getSelectedItem();
        if (sel == null) {
            return;
        }
        runAsync(() -> {
            api.removeFromWatchlist(sel.symbol());
            return null;
        }, v -> loadWatchlist(), this::status);
    }

    /* ============================== helpers ============================== */

    /** Runs {@code work} on a daemon thread; posts success/failure back to the FX thread. */
    private <T> void runAsync(Callable<T> work, Consumer<T> onSuccess, Consumer<String> onError) {
        Thread t = new Thread(() -> {
            try {
                T result = work.call();
                Platform.runLater(() -> onSuccess.accept(result));
            } catch (ApiException e) {
                Platform.runLater(() -> onError.accept(e.getMessage()));
            } catch (Exception e) {
                Platform.runLater(() -> onError.accept(String.valueOf(e.getMessage())));
            }
        }, "argos-desktop-io");
        t.setDaemon(true);
        t.start();
    }

    private void status(String msg) {
        if (mainStatus != null) {
            mainStatus.setText(msg);
        }
    }

    private TableColumn<DashboardHolding, String> textCol(
            String title, double width, java.util.function.Function<DashboardHolding, String> value) {
        TableColumn<DashboardHolding, String> col = new TableColumn<>(title);
        col.setPrefWidth(width);
        col.setCellValueFactory(cd -> new SimpleStringProperty(value.apply(cd.getValue())));
        return col;
    }

    private TableColumn<QuoteView, String> watchCol(
            String title, double width, java.util.function.Function<QuoteView, String> value) {
        TableColumn<QuoteView, String> col = new TableColumn<>(title);
        col.setPrefWidth(width);
        col.setCellValueFactory(cd -> new SimpleStringProperty(value.apply(cd.getValue())));
        return col;
    }

    private Region tile(String caption, Label valueLabel) {
        Label cap = new Label(caption.toUpperCase());
        cap.setStyle("-fx-font-size: 10px; -fx-font-weight: bold; -fx-text-fill: " + MUTED + ";");
        if (valueLabel.getStyle().isEmpty()) {
            valueLabel.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: " + TEXT + ";");
        }
        VBox box = new VBox(6, cap, valueLabel);
        box.setPadding(new Insets(14, 18, 14, 18));
        box.setPrefWidth(210);
        box.setStyle("-fx-background-color: " + PANEL + "; -fx-background-radius: 10;");
        HBox.setHgrow(box, Priority.ALWAYS);
        return box;
    }

    private static Label label(String text, String color) {
        Label l = new Label(text);
        l.setStyle("-fx-text-fill: " + color + ";");
        return l;
    }

    private static Region spacer(double h) {
        Region r = new Region();
        r.setPrefHeight(h);
        return r;
    }

    private static void setDisabled(boolean disabled, javafx.scene.Node... nodes) {
        for (javafx.scene.Node n : nodes) {
            n.setDisable(disabled);
        }
    }

    private void applyStylesheet(Scene scene) {
        var url = getClass().getResource("/desktop.css");
        if (url != null) {
            scene.getStylesheets().add(url.toExternalForm());
        }
    }

    /* ----------------------------- formatting --------------------------- */

    private static String money(BigDecimal v) {
        return v == null ? "—" : "₹" + String.format("%,.2f", v);
    }

    /** Money from a raw string price + currency code (quotes carry price as text). */
    private static String formatMoney(String price, String currency) {
        if (price == null || price.isBlank() || price.equals("—")) {
            return "—";
        }
        try {
            String formatted = String.format("%,.2f", new BigDecimal(price));
            return "INR".equalsIgnoreCase(currency) ? "₹" + formatted : formatted + " " + currency;
        } catch (NumberFormatException e) {
            return price + (currency == null ? "" : " " + currency);
        }
    }

    private static String plain(BigDecimal v) {
        return v == null ? "—" : v.stripTrailingZeros().toPlainString();
    }

    private static String pct(double fraction) {
        return String.format("%.2f%%", fraction * 100);
    }

    private static String signedPct(double fraction) {
        return String.format("%+.2f%%", fraction * 100);
    }

    private static String formatAsOf(String iso) {
        if (iso == null || iso.isBlank()) {
            return "—";
        }
        try {
            return AS_OF.format(Instant.parse(iso));
        } catch (Exception e) {
            return iso;
        }
    }
}
