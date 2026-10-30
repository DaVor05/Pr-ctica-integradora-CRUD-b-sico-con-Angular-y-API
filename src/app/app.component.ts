import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TareaService } from './services/tarea';
import { Tarea } from './models/tarea';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  tareas: Tarea[] = [];
  tareaForm: FormGroup;
  
  editando: boolean = false;
  idTareaEnEdicion: number | null = null;

  mensajeExito: string = '';
  mensajeError: string = '';

  constructor(private fb: FormBuilder, private tareaService: TareaService) {
    this.tareaForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      completed: [false]
    });
  }

  ngOnInit(): void {
    this.cargarTareas();
  }

  cargarTareas(): void {
    this.tareaService.getTareas().subscribe({
      next: (data) => {
        this.tareas = data;
      },
      error: (err) => {
        this.mostrarError('Error al cargar las tareas desde la API.');
      }
    });
  }

  guardarTarea(): void {
    if (this.tareaForm.invalid) {
      this.tareaForm.markAllAsTouched();
      return;
    }

    const tareaData: Tarea = this.tareaForm.value;

    if (this.editando && this.idTareaEnEdicion !== null) {
      this.tareaService.actualizarTarea(this.idTareaEnEdicion, tareaData).subscribe({
        next: (updated) => {
          const index = this.tareas.findIndex(t => t.id === this.idTareaEnEdicion);
          if (index !== -1) {
            this.tareas[index] = { ...updated, id: this.idTareaEnEdicion ?? undefined };
          }
          this.mostrarExito('¡Tarea modificada exitosamente!');
          this.limpiarFormulario();
        },
        error: (err) => {
          this.mostrarError('Ocurrió un error al actualizar la tarea.');
        }
      });
    } else {
      this.tareaService.crearTarea(tareaData).subscribe({
        next: (nueva) => {
          nueva.id = this.tareas.length > 0 ? Math.max(...this.tareas.map(t => t.id || 0)) + 1 : 1;
          this.tareas.unshift(nueva);
          this.mostrarExito('¡Tarea agregada exitosamente!');
          this.limpiarFormulario();
        },
        error: (err) => {
          this.mostrarError('Ocurrió un error al crear la tarea.');
        }
      });
    }
  }

  seleccionarParaEditar(tarea: Tarea): void {
    this.editando = true;
    this.idTareaEnEdicion = tarea.id || null;
    this.tareaForm.setValue({
      title: tarea.title,
      completed: tarea.completed
    });
    this.limpiarMensajes();
  }

  eliminarTarea(id?: number): void {
    if (!id) return;
    
    this.tareaService.eliminarTarea(id).subscribe({
      next: () => {
        this.tareas = this.tareas.filter(t => t.id !== id);
        this.mostrarExito('¡Tarea eliminada correctamente!');
      },
      error: (err) => {
        this.mostrarError('No se pudo eliminar la tarea.');
      }
    });
  }

  limpiarFormulario(): void {
    this.tareaForm.reset({ title: '', completed: false });
    this.editando = false;
    this.idTareaEnEdicion = null;
  }

  mostrarExito(msg: string): void {
    this.mensajeExito = msg;
    this.mensajeError = '';
    setTimeout(() => this.mensajeExito = '', 4000);
  }

  mostrarError(msg: string): void {
    this.mensajeError = msg;
    this.mensajeExito = '';
    setTimeout(() => this.mensajeError = '', 4000);
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }
}