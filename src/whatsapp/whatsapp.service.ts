import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { normalizeToE164 } from '../common/utils/phone-e164';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly sandbox: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly commissions: CommissionsService,
  ) {
    this.baseUrl =
      this.config.get<string>('notifml.baseUrl') ?? 'https://api.notif.ml';
    this.apiKey = this.config.get<string>('notifml.apiKey') ?? '';
    this.sandbox = this.config.get<boolean>('notifml.sandbox') ?? false;
  }

  private appUrl(): string {
    return this.config.get<string>('app.url') ?? 'https://donisend.com';
  }

  async send(to: string, message: string, mediaUrl?: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('NOTIFML_API_KEY manquant — WhatsApp ignoré');
      return;
    }

    const raw = to?.trim() ?? '';
    if (!raw) {
      this.logger.warn(
        'Numéro WhatsApp manquant — renseignez phoneMali ou phoneRussia à l’inscription (ex. +22370123456 ou 70123456)',
      );
      return;
    }

    const phone = normalizeToE164(raw);
    if (!phone) {
      this.logger.warn(
        `Numéro non reconnu pour WhatsApp (saisie reçue : ${raw.length} caractères) — Mali : +223…, ou 8 chiffres nationaux (50…–99…), ou 0 puis 8 chiffres ; Russie : +7…`,
      );
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        to: phone,
        channel: 'whatsapp',
        message,
        sandbox: this.sandbox,
        ...(mediaUrl && { mediaUrl }),
      };

      await firstValueFrom(
        this.http.post(`${this.baseUrl.replace(/\/$/, '')}/api/send`, payload, {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }),
      );

      this.logger.log(
        `WhatsApp OK ${phone}${this.sandbox ? ' [SANDBOX]' : ''}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Échec WhatsApp vers ${phone}: ${msg}`);
    }
  }

  async sendWelcome(user: { name: string; phone: string }): Promise<void> {
    const commissionPct = await this.commissions.getCommissionEffectivePercent();
    const message = `✅ *Bienvenue sur DoniSend, ${user.name} !*

Votre compte a été créé avec succès.

Votre compte est *actif immédiatement* — vous pouvez commencer à échanger dès maintenant.

Échangez vos CFA ↔ Roubles en toute sécurité, au taux Google exact, avec une commission de seulement ${commissionPct}%.

👉 Connectez-vous sur ${this.appUrl()}

_DoniSend — L'échange sécurisé pour la diaspora malienne_`;

    await this.send(user.phone, message);
  }

  async sendKycSubmitted(user: { name: string; phone: string }): Promise<void> {
    const message = `📋 *Documents reçus, ${user.name}*

Vos documents d'identité ont bien été reçus et sont en cours de vérification.

⏳ Délai habituel : *moins de 24h*

Vous recevrez une notification WhatsApp dès que votre compte sera validé.

_DoniSend_`;

    await this.send(user.phone, message);
  }

  async sendKycApproved(user: { name: string; phone: string }): Promise<void> {
    const message = `🎉 *Identité vérifiée, ${user.name} !*

Votre compte DoniSend est maintenant *entièrement activé*.

Vous pouvez dès maintenant :
• Poster une demande d'échange CFA ↔ Roubles
• Suivre vos transactions en temps réel
• Échanger en toute sécurité

👉 ${this.appUrl()}/tableau-de-bord

_DoniSend_`;

    await this.send(user.phone, message);
  }

  async sendKycRejected(
    user: { name: string; phone: string },
    reason: string,
  ): Promise<void> {
    const message = `⚠️ *Vérification incomplète, ${user.name}*

Votre demande de vérification n'a pas pu être validée.

*Raison :* ${reason}

*Que faire ?*
1. Connectez-vous à votre compte
2. Soumettez à nouveau vos documents (photo nette, lisible)
3. Assurez-vous que votre selfie est clair et récent

👉 ${this.appUrl()}/kyc

Des questions ? Répondez directement à ce message.

_DoniSend_`;

    await this.send(user.phone, message);
  }

  async sendRequestCreated(params: {
    user: { name: string; phone: string };
    requestId: number;
    type: 'NEED_RUB' | 'NEED_CFA';
    amountToSend: string;
    amountReceive: string;
    expiresInMin: number;
  }): Promise<void> {
    const direction = `${params.amountToSend} → *${params.amountReceive}*`;

    const message = `📤 *Demande publiée #${params.requestId}*

Bonjour ${params.user.name}, votre demande a été enregistrée avec succès.

💱 *Échange :* ${direction}
⏰ *Expire dans :* ${params.expiresInMin} minutes

Un opérateur va prendre en charge votre demande très prochainement.

*Ne fermez pas l'application* — vous recevrez une notification dès qu'un opérateur est disponible.

👉 Suivre ma demande : ${this.appUrl()}/demandes/${params.requestId}

_DoniSend_`;

    await this.send(params.user.phone, message);
  }

  async sendRequestTaken(params: {
    user: { name: string; phone: string };
    transactionId: number;
    platformAccountNumber: string;
    platformAccountName: string;
    exactAmount: string;
    operatorName: string;
  }): Promise<void> {
    const message = `🟢 *Opérateur assigné ! Action requise*

Bonjour ${params.user.name}, un opérateur (${params.operatorName}) a pris en charge votre échange.

─────────────────────
📲 *Envoyez MAINTENANT :*
Numéro : *${params.platformAccountNumber}*
Via : *${params.platformAccountName}*
Montant EXACT : *${params.exactAmount}*
─────────────────────

⚠️ *Important :*
• Envoyez sur ce numéro DoniSend uniquement
• Ne pas envoyer directement à l'opérateur
• Uploadez votre reçu dans l'app après l'envoi

👉 Aller sur ma transaction : ${this.appUrl()}/transactions/${params.transactionId}

_DoniSend — Transaction #${params.transactionId}_`;

    await this.send(params.user.phone, message);
  }

  async sendClientSentConfirmed(params: {
    user: { name: string; phone: string };
    transactionId: number;
    amountSent: string;
  }): Promise<void> {
    const message = `✅ *Paiement reçu — ${params.amountSent}*

Bonjour ${params.user.name}, votre preuve de paiement a bien été reçue.

🔄 *Statut :* DoniSend traite votre virement ; l'opérateur préparera l'envoi de vos fonds.

Vous serez notifié dès que vos roubles sont en route.

👉 ${this.appUrl()}/transactions/${params.transactionId}

_DoniSend — Transaction #${params.transactionId}_`;

    await this.send(params.user.phone, message);
  }

  async sendOperatorSentFunds(params: {
    user: { name: string; phone: string };
    transactionId: number;
    amountSent: string;
    receiveNumber: string;
  }): Promise<void> {
    const message = `💸 *Vos fonds sont en route !*

Bonjour ${params.user.name}, l'opérateur vient d'envoyer *${params.amountSent}* sur votre numéro.

📲 *Vérifiez :* ${params.receiveNumber}

*Dès réception :*
1. Vérifiez le montant reçu
2. Ouvrez l'app et confirmez la réception
3. ✅ L'échange sera clôturé

⚠️ Vous avez *2 heures* pour confirmer la réception.

👉 ${this.appUrl()}/transactions/${params.transactionId}

_DoniSend — Transaction #${params.transactionId}_`;

    await this.send(params.user.phone, message);
  }

  async sendTransactionCompleted(params: {
    user: { name: string; phone: string };
    transactionId: number;
    amountSent: string;
    amountReceived: string;
    rate: string;
  }): Promise<void> {
    const message = `🎉 *Échange réussi !*

Félicitations ${params.user.name}, votre transaction est clôturée avec succès.

📊 *Récapitulatif :*
• Envoyé : *${params.amountSent}*
• Reçu : *${params.amountReceived}*
• Taux & commission : ${params.rate}

⭐ *Donnez votre avis* sur cet échange dans l'application — cela aide toute la communauté.

Merci de faire confiance à DoniSend. À bientôt !

👉 Laisser un avis : ${this.appUrl()}/transactions/${params.transactionId}

_DoniSend — L'échange sécurisé_`;

    await this.send(params.user.phone, message);
  }

  async sendTransactionCancelled(params: {
    user: { name: string; phone: string };
    transactionId: number;
    reason: string;
  }): Promise<void> {
    const message = `❌ *Transaction annulée — #${params.transactionId}*

Bonjour ${params.user.name}, votre transaction a été annulée.

*Raison :* ${params.reason}

Aucun frais ne vous a été prélevé.

Vous pouvez publier une nouvelle demande à tout moment.

👉 ${this.appUrl()}/demandes/nouvelle

Des questions ? Répondez à ce message.

_DoniSend_`;

    await this.send(params.user.phone, message);
  }

  async sendRequestExpired(params: {
    user: { name: string; phone: string };
    requestId: number;
  }): Promise<void> {
    const message = `⏰ *Demande expirée — #${params.requestId}*

Bonjour ${params.user.name}, votre demande d'échange a expiré car aucun opérateur n'était disponible dans le délai imparti.

*Que faire ?*
Publiez une nouvelle demande — nos opérateurs sont disponibles de *8h à 22h (heure de Moscou)*.

👉 Nouvelle demande : ${this.appUrl()}/demandes/nouvelle

_DoniSend_`;

    await this.send(params.user.phone, message);
  }

  async sendDisputeOpened(params: {
    user: { name: string; phone: string };
    transactionId: number;
    disputeId: number;
  }): Promise<void> {
    const message = `🔴 *Litige ouvert — #${params.disputeId}*

Bonjour ${params.user.name}, votre litige sur la transaction #${params.transactionId} a bien été enregistré.

Un administrateur DoniSend va examiner votre dossier dans les *prochaines 24 heures*.

*Ce que vous pouvez faire :*
• Ajouter des preuves supplémentaires dans l'app
• Répondre aux questions de l'admin

👉 Suivre mon litige : ${this.appUrl()}/transactions/${params.transactionId}

_DoniSend_`;

    await this.send(params.user.phone, message);
  }

  async sendDisputeResolved(params: {
    user: { name: string; phone: string };
    transactionId: number;
    resolution: string;
  }): Promise<void> {
    const message = `✅ *Litige résolu — Transaction #${params.transactionId}*

Bonjour ${params.user.name}, l'administrateur a rendu sa décision.

*Décision :* ${params.resolution}

Si vous avez des questions sur cette décision, répondez directement à ce message.

_DoniSend_`;

    await this.send(params.user.phone, message);
  }

  async sendSendReminder(params: {
    user: { name: string; phone: string };
    transactionId: number;
    platformAccountNumber: string;
    exactAmount: string;
    expiresInMin: number;
  }): Promise<void> {
    const message = `⏳ *Rappel — Action requise*

Bonjour ${params.user.name}, votre transaction #${params.transactionId} attend votre paiement.

📲 *Envoyez :* *${params.exactAmount}*
📞 *Sur :* ${params.platformAccountNumber}

⚠️ Il vous reste *${params.expiresInMin} minutes* avant annulation automatique.

👉 ${this.appUrl()}/transactions/${params.transactionId}

_DoniSend_`;

    await this.send(params.user.phone, message);
  }
}
