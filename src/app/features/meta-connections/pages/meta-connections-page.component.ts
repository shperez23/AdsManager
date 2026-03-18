import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { MetaService } from '../../../core/api/services/meta.service';
import { ToastService } from '../../../core/notifications/toast.service';
import {
  CreateMetaConnectionRequest,
  MetaConnection,
  UpdateMetaConnectionRequest,
} from '../../../shared/models';
import {
  MetaConnectionFormSubmitEvent,
  MetaConnectionsFormComponent,
} from '../components/meta-connections-form/meta-connections-form.component';
import { MetaConnectionsListComponent } from '../components/meta-connections-list/meta-connections-list.component';

@Component({
  selector: 'app-meta-connections-page',
  standalone: true,
  imports: [CommonModule, MetaConnectionsFormComponent, MetaConnectionsListComponent],
  templateUrl: './meta-connections-page.component.html',
})
export class MetaConnectionsPageComponent implements OnInit {
  connections: MetaConnection[] = [];
  selectedConnection: MetaConnection | null = null;

  isLoading = false;
  isSubmitting = false;
  activeActionId: string | null = null;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private readonly metaService: MetaService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadConnections();
  }

  onRetry(): void {
    this.loadConnections();
  }

  onEdit(connection: MetaConnection): void {
    this.selectedConnection = connection;
  }

  onCancelEdit(): void {
    this.selectedConnection = null;
  }

  onSubmit(event: MetaConnectionFormSubmitEvent): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = true;

    const request$ =
      event.mode === 'edit' && this.selectedConnection
        ? this.metaService.updateConnection(
            this.selectedConnection.id,
            event.value as UpdateMetaConnectionRequest,
          )
        : this.metaService.createConnection(event.value as CreateMetaConnectionRequest);

    request$.pipe(finalize(() => (this.isSubmitting = false))).subscribe({
      next: () => {
        this.successMessage =
          event.mode === 'edit'
            ? 'Conexión actualizada correctamente.'
            : 'Conexión creada correctamente.';
        this.toastService.success({ title: 'Meta Connections', message: this.successMessage });
        this.selectedConnection = null;
        this.loadConnections();
      },
      error: () => {
        this.errorMessage = 'No fue posible guardar la conexión Meta.';
        this.toastService.error({ title: 'Meta Connections', message: this.errorMessage });
      },
    });
  }

  onDelete(connection: MetaConnection): void {
    this.runConnectionAction(
      connection.id,
      this.metaService.deleteConnection(connection.id),
      'Conexión eliminada correctamente.',
      'No se pudo eliminar la conexión.',
    );
  }

  onValidate(connection: MetaConnection): void {
    this.runConnectionAction(
      connection.id,
      this.metaService.validateConnection(connection.id),
      'Conexión validada correctamente.',
      'No se pudo validar la conexión.',
    );
  }

  onRefreshToken(connection: MetaConnection): void {
    this.runConnectionAction(
      connection.id,
      this.metaService.refreshConnectionToken(connection.id),
      'Token refrescado correctamente.',
      'No se pudo refrescar el token.',
    );
  }

  private loadConnections(): void {
    this.errorMessage = null;
    this.isLoading = true;

    this.metaService
      .getConnections()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (connections) => {
          this.connections = connections;
        },
        error: () => {
          this.errorMessage = 'No fue posible cargar las conexiones Meta.';
        },
      });
  }

  private runConnectionAction(
    connectionId: string,
    request$: ReturnType<MetaService['deleteConnection']>,
    successMessage: string,
    errorMessage: string,
  ): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.activeActionId = connectionId;

    request$.pipe(finalize(() => (this.activeActionId = null))).subscribe({
      next: () => {
        this.successMessage = successMessage;
        this.toastService.success({ title: 'Meta Connections', message: successMessage });
        this.loadConnections();
      },
      error: () => {
        this.errorMessage = errorMessage;
        this.toastService.error({ title: 'Meta Connections', message: errorMessage });
      },
    });
  }
}
