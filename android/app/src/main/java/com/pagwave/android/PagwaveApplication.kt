package com.pagwave.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.pagwave.android.core.network.PagwaveApiClient
import com.pagwave.android.data.PagwaveRepository

class PagwaveApplication : Application() {
    lateinit var apiClient: PagwaveApiClient
        private set
    lateinit var repository: PagwaveRepository
        private set

    override fun onCreate() {
        super.onCreate()
        apiClient = PagwaveApiClient(this)
        repository = PagwaveRepository(apiClient)
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "Pagwave Alertas & Pagamentos",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Alertas em tempo real de depósitos, saques, P2P e segurança."
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    companion object {
        const val ALERT_CHANNEL_ID = "pagwave_alerts"
    }
}
