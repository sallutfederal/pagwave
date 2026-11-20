package com.pagwave.android.core.model

import com.pagwave.android.core.designsystem.SelectOption
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import java.text.NumberFormat
import java.util.Locale

// ─── Shared Error ───────────────────────────────────────────────────────────

@Serializable
data class ApiErrorResponse(
    val error: String? = null,
    val message: String? = null,
)

// ─── Auth ───────────────────────────────────────────────────────────────────

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val twoFactorCode: String? = null,
)

@Serializable
data class LoginResponse(
    val ok: Boolean = false,
    val requiresTwoFactor: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

@Serializable
data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val accountType: String = "PERSONAL",
    val companyName: String? = null,
)

@Serializable
data class ForgotPasswordRequest(val email: String)

@Serializable
data class LocaleRequest(val locale: String)

@Serializable
data class BasicOkResponse(
    val ok: Boolean = false,
    val message: String? = null,
    val locale: String? = null,
)

// ─── Profile, Preferences & Security ────────────────────────────────────────

@Serializable
data class UserProfileDto(
    val firstName: String? = null,
    val lastName: String? = null,
    val displayName: String? = null,
    val phone: String? = null,
    val country: String? = null,
    val companyName: String? = null,
    val companyTaxId: String? = null,
    val kycStatus: String? = null,
    val kycLevel: Int? = null,
)

@Serializable
data class NotificationPreferencesDto(
    val paymentAlerts: Boolean = true,
    val weeklyDigest: Boolean = true,
    val productRenewals: Boolean = false,
    val securityNotices: Boolean = true,
)

@Serializable
data class ProfileResponse(
    val ok: Boolean = false,
    val email: String = "",
    val locale: String? = null,
    val twoFactorEnabled: Boolean = false,
    val emailVerified: Boolean = false,
    val profile: UserProfileDto? = null,
    val preferences: NotificationPreferencesDto? = null,
)

@Serializable
data class ProfilePatchRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val displayName: String? = null,
    val phone: String? = null,
    val country: String? = null,
    val companyName: String? = null,
    val companyTaxId: String? = null,
    val preferences: NotificationPreferencesDto? = null,
)

@Serializable
data class SecurityActionRequest(
    val action: String,
    val currentPassword: String? = null,
    val newPassword: String? = null,
    val code: String? = null,
    val password: String? = null,
)

@Serializable
data class TwoFactorSetupResponse(
    val secret: String? = null,
    val otpauthUrl: String? = null,
    val message: String? = null,
)

// ─── Dashboard ──────────────────────────────────────────────────────────────

@Serializable
data class AvatarDto(
    val url: String = "",
    val initials: String = "PW",
)

@Serializable
data class GreetingDto(
    val name: String = "",
    val email: String = "",
    val title: String = "",
    val subtitle: String = "",
    val avatar: AvatarDto = AvatarDto(),
    val accountLabel: String = "",
)

@Serializable
data class QuickActionDto(
    val id: String,
    val label: String,
    val active: Boolean = false,
)

@Serializable
data class DashboardSummaryResponse(
    val greeting: GreetingDto = GreetingDto(),
    val quickActions: List<QuickActionDto> = emptyList(),
)

@Serializable
data class StatisticSegmentDto(
    val id: String,
    val label: String,
    val value: Double,
    val degrees: Double,
)

@Serializable
data class StatisticResponse(
    val total: Double = 0.0,
    val currency: String = "USD",
    val period: String = "this-month",
    val label: String = "",
    val segments: List<StatisticSegmentDto> = emptyList(),
)

@Serializable
data class SaleCustomerDto(
    val name: String = "",
    val email: String = "",
    val avatar: AvatarDto = AvatarDto(),
)

@Serializable
data class SaleDto(
    val id: String,
    val customer: SaleCustomerDto,
    val date: String,
    val status: String,
    val amount: Double,
    val currency: String,
)

@Serializable
data class RecentSalesResponse(
    val sales: List<SaleDto> = emptyList(),
)

@Serializable
data class TransactionDto(
    val id: String,
    val title: String,
    val subtitle: String,
    val avatar: AvatarDto = AvatarDto(),
    val amount: Double,
    val currency: String,
    val usdAmount: Double? = null,
    val date: String,
    val category: String,
    val method: String,
    val status: String,
    val direction: String,
)

@Serializable
data class TransactionsResponse(
    val transactions: List<TransactionDto> = emptyList(),
)

// ─── Wallets, Cash-in, Cash-out, Transfer, Conversion ───────────────────────

@Serializable
data class CurrencyBalanceDto(
    val available: Double = 0.0,
    val blocked: Double = 0.0,
)

@Serializable
data class WalletBalanceResponse(
    val ok: Boolean = false,
    val isSandbox: Boolean = false,
    val balances: Map<String, CurrencyBalanceDto> = emptyMap(),
    @SerialName("blocked_currencies")
    val blockedCurrencies: List<String> = emptyList(),
    val kycLevel: Int = 0,
    val kycStatus: String = "NONE",
    @SerialName("updated_at")
    val updatedAt: String = "",
)

@Serializable
data class CashinRequest(
    val purpose: String = "self_deposit",
    val currency: String,
    val method: String? = null,
    val mode: String = "dynamic",
    val amount: Double? = null,
    val description: String? = null,
    val payer: Map<String, String> = emptyMap(),
)

@Serializable
data class CashinResponse(
    val ok: Boolean = false,
    val externalId: String = "",
    val mode: String = "dynamic",
    val purpose: String = "self_deposit",
    val result: JsonObject = JsonObject(emptyMap()),
)

@Serializable
data class SandboxSimulateRequest(
    @SerialName("request_number")
    val requestNumber: String,
    val status: String = "paid",
    val amount: Double? = null,
)

@Serializable
data class SandboxSimulateResponse(
    val ok: Boolean = false,
    val result: JsonObject? = null,
)

@Serializable
data class TransferRequest(
    val currency: String,
    val recipientEmail: String,
    val amount: Double,
    val description: String? = null,
)

@Serializable
data class TransferReceiptDto(
    val referenceId: String = "",
    val amount: String = "0",
    val fee: String = "0",
    val netAmount: String = "0",
    val currencyCode: String = "",
    val recipientEmail: String = "",
    val recipientName: String = "",
    val status: String = "",
)

@Serializable
data class TransferResponse(
    val ok: Boolean = false,
    val transfer: TransferReceiptDto? = null,
)

@Serializable
data class ConversionRequest(
    val action: String, // "simulate" | "execute"
    val from: String,
    val to: String,
    val amount: Double,
)

@Serializable
data class ConversionResponse(
    val ok: Boolean = false,
    val simulation: JsonObject? = null,
    val conversion: JsonObject? = null,
    val balances: Map<String, CurrencyBalanceDto>? = null,
)

@Serializable
data class BeneficiaryDto(
    val id: String,
    val label: String,
    val currency: String,
    val rail: String,
    val summary: String,
    val details: Map<String, String> = emptyMap(),
    val isDefault: Boolean = false,
)

@Serializable
data class BeneficiariesResponse(
    val ok: Boolean = false,
    val beneficiaries: List<BeneficiaryDto> = emptyList(),
)

@Serializable
data class CreateBeneficiaryRequest(
    val label: String,
    val currency: String,
    val rail: String,
    val details: Map<String, String>,
    val isDefault: Boolean = false,
)

@Serializable
data class CashoutRequest(
    val beneficiaryId: String? = null,
    val currency: String? = null,
    val rail: String? = null,
    val details: Map<String, String>? = null,
    val amount: Double,
    val description: String? = null,
)

@Serializable
data class CashoutResponse(
    val ok: Boolean = false,
    val externalId: String = "",
    val result: JsonObject? = null,
)

// ─── Notifications ──────────────────────────────────────────────────────────

@Serializable
data class NotificationItemDto(
    val id: String,
    val type: String,
    val channel: String = "IN_APP",
    val title: String,
    val body: String,
    val data: JsonElement? = null,
    val isRead: Boolean = false,
    val createdAt: String,
)

@Serializable
data class NotificationsResponse(
    val ok: Boolean = false,
    val unreadCount: Int = 0,
    val notifications: List<NotificationItemDto> = emptyList(),
)

@Serializable
data class NotificationActionRequest(
    val action: String, // "read" | "read_all" | "test" | "weekly_digest"
    val id: String? = null,
)

// ─── Integrations / API Keys ────────────────────────────────────────────────

@Serializable
data class ApiCredentialDto(
    val id: String = "",
    val label: String = "",
    val clientId: String = "",
    val secretPreview: String = "",
    val secret: String? = null,
    val webhookUrl: String = "",
    val requestCount: Int = 0,
    val lastUsedAt: String? = null,
)

@Serializable
data class ApiLogDto(
    val id: String = "",
    val method: String = "",
    val endpoint: String = "",
    val currency: String? = null,
    val statusCode: Int = 200,
    val ok: Boolean = true,
    val latencyMs: Int = 0,
    val createdAt: String = "",
)

@Serializable
data class IntegrationsResponse(
    val ok: Boolean = false,
    val isSandbox: Boolean = true,
    val credential: ApiCredentialDto? = null,
    val logs: List<ApiLogDto> = emptyList(),
)

@Serializable
data class IntegrationKeyActionRequest(
    val action: String, // "rotate" | "update"
    val label: String? = null,
    val webhookUrl: String? = null,
)

@Serializable
data class IntegrationKeyActionResponse(
    val ok: Boolean = false,
    val credential: ApiCredentialDto? = null,
)

// ─── Exact Dynamic Currency Specifications Matching src/lib/xpag/currencies.ts ──

data class DynamicFieldSpec(
    val key: String,
    val label: String,
    val placeholder: String = "",
    val isEmail: Boolean = false,
    val required: Boolean = false,
    val whenMethod: List<String>? = null,
    val options: List<SelectOption>? = null,
    val hint: String? = null,
)

data class RailMeta(
    val id: String,
    val label: String,
    val description: String,
)

data class CurrencySpec(
    val code: String,
    val symbol: String,
    val name: String,
    val isCrypto: Boolean = false,
    val integerOnly: Boolean = false,
    val convertible: Boolean = true,
    val minConvertFrom: Double? = null,
    val supportsOpenValueCashin: Boolean = false,
    val cashinMethods: List<RailMeta> = emptyList(),
    val cashinPayerFields: List<DynamicFieldSpec> = emptyList(),
    val cashoutRails: List<RailMeta> = emptyList(),
    val cashoutFields: List<DynamicFieldSpec> = emptyList(),
)

object CurrenciesCatalog {
    val walletCurrencies = listOf("BRL", "USD", "USDT", "MXN", "COP", "ARS", "BOB", "CLP", "VES", "USDC")

    private val docTypesAr = listOf(SelectOption("CUIT", "CUIT"))
    private val docTypesCop = listOf(
        SelectOption("CC", "Cédula (CC)"),
        SelectOption("CE", "Cédula Extranjería (CE)"),
        SelectOption("NIT", "NIT"),
        SelectOption("PAS", "Passaporte"),
    )
    private val docTypesBob = listOf(
        SelectOption("CI", "CI"),
        SelectOption("NIT", "NIT"),
        SelectOption("PAS", "Passaporte"),
    )
    private val docTypesClp = listOf(
        SelectOption("RUT", "RUT"),
        SelectOption("CE", "CE"),
        SelectOption("PASSPORT", "Passaporte"),
    )
    private val docTypesEc = listOf(
        SelectOption("CI", "CI"),
        SelectOption("RUC", "RUC"),
        SelectOption("PAS", "Passaporte"),
    )
    private val docTypesVe = listOf(
        SelectOption("CI", "CI (V-/E-)"),
        SelectOption("RIF", "RIF (J-)"),
    )

    val specs: Map<String, CurrencySpec> = mapOf(
        "BRL" to CurrencySpec(
            code = "BRL",
            symbol = "R$",
            name = "Real Brasileiro",
            supportsOpenValueCashin = true,
            cashinMethods = listOf(RailMeta("PIX", "Pix QR / Copia e Cola", "Liquidação instantânea 24/7.")),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Opcional em BRL"),
                DynamicFieldSpec("document", "CPF/CNPJ do pagador", "Opcional (11 ou 14 dígitos)"),
            ),
            cashoutRails = listOf(
                RailMeta("PIX", "Chave Pix", "CPF, CNPJ, e-mail, telefone ou EVP."),
                RailMeta("BRCODE", "Pix Copia e Cola", "Pague um QR Code EMV (000201...)."),
            ),
            cashoutFields = listOf(
                DynamicFieldSpec(
                    "pix_type", "Tipo de chave", required = true, whenMethod = listOf("PIX"),
                    options = listOf(
                        SelectOption("CPF", "CPF"),
                        SelectOption("CNPJ", "CNPJ"),
                        SelectOption("EMAIL", "E-mail"),
                        SelectOption("PHONE", "Telefone (+55)"),
                        SelectOption("EVP", "Chave aleatória (EVP)"),
                    ),
                ),
                DynamicFieldSpec("pix_key", "Chave Pix", "Ex.: 52998224725 ou email@empresa.com", required = true, whenMethod = listOf("PIX")),
                DynamicFieldSpec("pix_copia_cola", "Código Pix Copia e Cola", "00020126580014br.gov.bcb.pix...", required = true, whenMethod = listOf("BRCODE")),
                DynamicFieldSpec("name", "Nome do favorecido", "Nome completo ou razão social", required = true, whenMethod = listOf("PIX")),
                DynamicFieldSpec("document", "CPF / CNPJ do favorecido", "Somente números (11 ou 14 dígitos)", required = true, whenMethod = listOf("PIX")),
            ),
        ),
        "MXN" to CurrencySpec(
            code = "MXN",
            symbol = "MX$",
            name = "Peso Mexicano",
            supportsOpenValueCashin = true,
            cashinMethods = listOf(
                RailMeta("SPEI", "SPEI (CLABE)", "Suporta valor fixo ou aberto."),
                RailMeta("OXXO", "OXXO Pay (Voucher)", "10 a 10.000 MXN em lojas OXXO."),
            ),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Nome completo"),
                DynamicFieldSpec("email", "E-mail (recomendado OXXO)", "pagador@empresa.com", isEmail = true),
                DynamicFieldSpec("document", "CURP / RFC", "Opcional"),
            ),
            cashoutRails = listOf(RailMeta("SPEI", "SPEI (CLABE 18 dígitos)", "Transferência interbancária mexicana.")),
            cashoutFields = listOf(
                DynamicFieldSpec("clabe", "CLABE", "18 dígitos numéricos", required = true),
                DynamicFieldSpec("name", "Nome do titular", "Nome completo", required = true),
                DynamicFieldSpec("document", "CURP ou RFC", "Identificação fiscal", required = true),
            ),
        ),
        "COP" to CurrencySpec(
            code = "COP",
            symbol = "COP$",
            name = "Peso Colombiano",
            minConvertFrom = 50_000.0,
            cashinMethods = listOf(
                RailMeta("NEQUI_QR", "Nequi QR / Link", "Expira em 45 minutos."),
                RailMeta("BREB", "Bre-B QR", "Chave instantânea colombiana."),
            ),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Opcional"),
                DynamicFieldSpec("phone", "Celular Nequi (opcional)", "3XXXXXXXXX (10 dígitos)"),
            ),
            cashoutRails = listOf(RailMeta("BREB", "Bre-B (Chave instantânea)", "Único trilho ativo de saque em COP.")),
            cashoutFields = listOf(
                DynamicFieldSpec(
                    "key_type", "Tipo de chave Bre-B", required = true,
                    options = listOf(SelectOption("PHONE", "Celular (3XXXXXXXXX)"), SelectOption("EMAIL", "E-mail"), SelectOption("CC", "Cédula (CC)")),
                ),
                DynamicFieldSpec("key", "Chave Bre-B", "3001234567 ou usuario@dominio.co", required = true),
                DynamicFieldSpec("name", "Nome do beneficiário", "Nome completo", required = true),
                DynamicFieldSpec("document_type", "Tipo de documento", required = true, options = docTypesCop),
                DynamicFieldSpec("document", "Documento", "Número do documento", required = true),
            ),
        ),
        "ARS" to CurrencySpec(
            code = "ARS",
            symbol = "ARS$",
            name = "Peso Argentino",
            cashinMethods = listOf(RailMeta("BANK_TRANSFER", "Transferência CVU", "Gera CVU temporário (~2s).")),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Obrigatório em ARS", required = true),
                DynamicFieldSpec("document", "CUIT (opcional)", "11 dígitos"),
            ),
            cashoutRails = listOf(RailMeta("BANK_TRANSFER", "Transferência CVU / CBU", "22 dígitos numéricos.")),
            cashoutFields = listOf(
                DynamicFieldSpec("account_number", "CVU / CBU", "22 dígitos numéricos", required = true),
                DynamicFieldSpec("name", "Nome do titular", "Obrigatório para ARS", required = true),
                DynamicFieldSpec("document_type", "Tipo de documento", options = docTypesAr),
                DynamicFieldSpec("document", "CUIT (opcional)", "11 dígitos"),
                DynamicFieldSpec("bank_code", "Código do banco (opcional)", "Ex.: 007"),
            ),
        ),
        "BOB" to CurrencySpec(
            code = "BOB",
            symbol = "Bs",
            name = "Boliviano",
            cashinMethods = listOf(RailMeta("QR", "QR Simple Bolívia", "Exige dados completos do pagador.")),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Obrigatório", required = true),
                DynamicFieldSpec("phone", "Telefone", "+59170000000", required = true),
                DynamicFieldSpec("email", "E-mail", "pagador@empresa.bo", isEmail = true, required = true),
                DynamicFieldSpec("document_type", "Tipo doc", required = true, options = docTypesBob),
                DynamicFieldSpec("document", "Documento", "CI / NIT", required = true),
            ),
            cashoutRails = listOf(RailMeta("BANK_TRANSFER", "Transferência Bancária (BO)", "Banco + conta + contato.")),
            cashoutFields = listOf(
                DynamicFieldSpec("bank_code", "Código do banco", "Ex.: BO.BNB", required = true),
                DynamicFieldSpec(
                    "account_type", "Tipo de conta", required = true,
                    options = listOf(SelectOption("CACC", "Conta Corrente (CACC)"), SelectOption("SVGS", "Poupança (SVGS)")),
                ),
                DynamicFieldSpec("account_number", "Número da conta", "Conta bancária", required = true),
                DynamicFieldSpec("name", "Nome do titular", "Nome completo", required = true),
                DynamicFieldSpec("document_type", "Tipo de documento", required = true, options = docTypesBob),
                DynamicFieldSpec("document", "Documento", "Número do documento", required = true),
                DynamicFieldSpec("phone", "Telefone", "+59170000000", required = true),
                DynamicFieldSpec("email", "E-mail", "titular@empresa.bo", isEmail = true, required = true),
            ),
        ),
        "CLP" to CurrencySpec(
            code = "CLP",
            symbol = "CLP$",
            name = "Peso Chileno",
            integerOnly = true,
            cashinMethods = listOf(
                RailMeta("BANK_TRANSFER", "Transferência / Khipu", "Valor inteiro em pesos."),
                RailMeta("CARD", "Cartão (Webpay)", "Pagamento via cartão local."),
                RailMeta("WALLET", "Carteira digital", "Checkout local CLP."),
            ),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Obrigatório", required = true),
                DynamicFieldSpec("email", "E-mail", "pagador@empresa.cl", isEmail = true, required = true),
                DynamicFieldSpec("document_type", "Tipo doc", required = true, options = docTypesClp),
                DynamicFieldSpec("document", "RUT", "12345678-5", required = true),
            ),
            cashoutRails = listOf(RailMeta("BANK_TRANSFER", "Transferência Bancária (CL)", "Valor inteiro + RUT válido.")),
            cashoutFields = listOf(
                DynamicFieldSpec("bank_code", "Código do banco (3 dígitos)", "Ex.: 001", required = true),
                DynamicFieldSpec(
                    "account_type", "Tipo de conta", required = true,
                    options = listOf(
                        SelectOption("CACC", "Cuenta Corriente (CACC)"),
                        SelectOption("VISTA", "Cuenta Vista / RUT (VISTA)"),
                        SelectOption("SVGS", "Ahorro (SVGS)"),
                        SelectOption("RUT", "CuentaRUT (RUT)"),
                        SelectOption("SALARY", "Salário (SALARY)"),
                    ),
                ),
                DynamicFieldSpec("account_number", "Número da conta", "Número da conta", required = true),
                DynamicFieldSpec("name", "Nome do titular", "Nome completo", required = true),
                DynamicFieldSpec("document_type", "Tipo de documento", required = true, options = docTypesClp),
                DynamicFieldSpec("document", "RUT / Documento", "Ex.: 12345678-5", required = true),
                DynamicFieldSpec("email", "E-mail", "titular@empresa.cl", isEmail = true, required = true),
            ),
        ),
        "USD" to CurrencySpec(
            code = "USD",
            symbol = "US$",
            name = "Dólar Americano",
            cashinMethods = listOf(
                RailMeta("BANK_TRANSFER", "Transferência (Equador)", "Checkout bancário em USD."),
                RailMeta("CASH", "Rede física (Cash)", "Pagamento presencial."),
            ),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Obrigatório", required = true),
                DynamicFieldSpec("phone", "Telefone", "+593990000000", required = true),
                DynamicFieldSpec("email", "E-mail", "pagador@empresa.ec", isEmail = true, required = true),
                DynamicFieldSpec("document_type", "Tipo doc", required = true, options = docTypesEc),
                DynamicFieldSpec("document", "CI / RUC", "10 ou 13 dígitos", required = true),
            ),
            cashoutRails = listOf(RailMeta("BANK_TRANSFER", "Transferência Bancária (EC)", "Código ex.: EC.PICH")),
            cashoutFields = listOf(
                DynamicFieldSpec("bank_code", "Código do banco", "Ex.: EC.PICH", required = true),
                DynamicFieldSpec(
                    "account_type", "Tipo de conta", required = true,
                    options = listOf(SelectOption("SVGS", "Poupança (SVGS)"), SelectOption("CACC", "Conta Corrente (CACC)")),
                ),
                DynamicFieldSpec("account_number", "Número da conta", "Número da conta", required = true),
                DynamicFieldSpec("name", "Nome do titular", "Nome completo", required = true),
                DynamicFieldSpec("document_type", "Tipo de documento", required = true, options = docTypesEc),
                DynamicFieldSpec("document", "CI / RUC", "10 ou 13 dígitos", required = true),
                DynamicFieldSpec("phone", "Telefone", "+593990000000", required = true),
                DynamicFieldSpec("email", "E-mail", "titular@empresa.ec", isEmail = true, required = true),
            ),
        ),
        "VES" to CurrencySpec(
            code = "VES",
            symbol = "Bs.D",
            name = "Bolívar Venezuelano",
            cashinMethods = listOf(
                RailMeta("PAGOMOVIL", "Pago Móvil", "Celular (11 dígitos) + CI/RIF."),
                RailMeta("BANK_TRANSFER", "Transferência Bancária (VE)", "Local em Bolívares."),
            ),
            cashinPayerFields = listOf(
                DynamicFieldSpec("name", "Nome do pagador", "Obrigatório", required = true),
                DynamicFieldSpec("phone", "Celular", "04141234567", required = true),
                DynamicFieldSpec("document_type", "Tipo doc", required = true, options = docTypesVe),
                DynamicFieldSpec("document", "CI / RIF", "V-12345678", required = true),
            ),
            cashoutRails = listOf(
                RailMeta("PAGOMOVIL", "Pago Móvil", "Celular 11 dígitos + banco 4 dígitos."),
                RailMeta("BANK_TRANSFER", "Transferência Bancária (VE)", "Conta 20 dígitos + banco 4 dígitos."),
            ),
            cashoutFields = listOf(
                DynamicFieldSpec("bank_code", "Código do banco (4 dígitos)", "Ex.: 0102 ou 0134", required = true),
                DynamicFieldSpec("phone", "Celular Pago Móvil", "11 dígitos (ex.: 04141234567)", required = true),
                DynamicFieldSpec("account_number", "Conta bancária (20 dígitos)", "01020123456789012345", required = true, whenMethod = listOf("BANK_TRANSFER")),
                DynamicFieldSpec("name", "Nome do titular", "Nome completo", required = true),
                DynamicFieldSpec("document_type", "Tipo de documento", required = true, options = docTypesVe),
                DynamicFieldSpec("document", "CI / RIF", "Ex.: V-12345678", required = true),
            ),
        ),
        "USDT" to CurrencySpec(
            code = "USDT",
            symbol = "USDT",
            name = "Tether USD (TRC20)",
            isCrypto = true,
            cashinMethods = listOf(RailMeta("TRON", "Depósito On-chain TRON (TRC20)", "Gera deposit_address exclusivo.")),
            cashoutRails = listOf(RailMeta("TRON", "Rede TRON (TRC20)", "Endereço iniciado com 'T' (34 chars Base58).")),
            cashoutFields = listOf(DynamicFieldSpec("address", "Endereço TRON (TRC20)", "T... (34 caracteres Base58)", required = true)),
        ),
        "USDC" to CurrencySpec(
            code = "USDC",
            symbol = "USDC",
            name = "USD Coin (Solana SPL)",
            isCrypto = true,
            convertible = false,
            cashinMethods = listOf(RailMeta("SOLANA", "Depósito On-chain Solana (SPL)", "Gera deposit_address Solana.")),
            cashoutRails = listOf(RailMeta("SOLANA", "Rede Solana (SPL)", "Chave pública Solana Base58 (32–44 chars).")),
            cashoutFields = listOf(DynamicFieldSpec("address", "Endereço Solana (SPL)", "Endereço Solana Base58", required = true)),
        ),
        "EUR" to CurrencySpec(
            code = "EUR",
            symbol = "€",
            name = "Euro",
            convertible = false,
        ),
    )

    fun spec(code: String): CurrencySpec =
        specs[code.uppercase()] ?: CurrencySpec(code, code, code, convertible = false)

    fun format(amount: Double, currency: String, signed: Boolean = false): String {
        val sp = spec(currency)
        val absVal = kotlin.math.abs(amount)
        val nf = NumberFormat.getNumberInstance(Locale("pt", "BR")).apply {
            minimumFractionDigits = if (sp.integerOnly) 0 else 2
            maximumFractionDigits = if (sp.integerOnly) 0 else if (sp.isCrypto) 4 else 2
        }
        val sign = when {
            amount < 0 -> "-"
            signed && amount > 0 -> "+"
            else -> ""
        }
        return "$sign${sp.symbol} ${nf.format(absVal)}"
    }
}
