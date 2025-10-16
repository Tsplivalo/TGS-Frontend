/**
 * Modelos de datos para productos
 * 
 * Este archivo define las estructuras de datos utilizadas para
 * gestionar productos en el sistema, incluyendo operaciones CRUD
 * y transferencia de datos con el backend.
 */

/**
 * DTO para transferir información completa de un producto
 * 
 * Representa un producto con todos sus datos, incluyendo información
 * adicional calculada por el backend.
 */
export interface ProductDTO {
  id: number;                   // Identificador único del producto
  description: string;          // Descripción principal del producto
  detail?: string;              // Detalles adicionales del producto
  price: number;               // Precio del producto
  stock: number;               // Cantidad disponible en inventario
  isIllegal: boolean;          // Indica si el producto es ilegal
  imageUrl?: string;           // URL de la imagen (solo frontend)
  distributorsCount?: number;  // Cantidad de distribuidores asociados
  detailsCount?: number;       // Cantidad de detalles del producto
}

/**
 * DTO para crear un nuevo producto
 * 
 * Contiene los datos mínimos requeridos para crear un producto
 * en el sistema. El campo detail es obligatorio.
 */
export interface CreateProductDTO {
  description: string;  // Descripción principal del producto
  detail: string;       // Detalles adicionales (requerido)
  price: number;        // Precio del producto
  stock: number;        // Cantidad inicial en inventario
  isIllegal: boolean;   // Indica si el producto es ilegal
}

/**
 * DTO para actualizar un producto existente
 * 
 * Todos los campos son opcionales, permitiendo actualizaciones
 * parciales del producto.
 */
export interface UpdateProductDTO {
  description?: string;  // Nueva descripción (opcional)
  detail?: string;       // Nuevos detalles (opcional)
  price?: number;        // Nuevo precio (opcional)
  stock?: number;        // Nuevo stock (opcional)
  isIllegal?: boolean;   // Nuevo estado de legalidad (opcional)
}

/**
 * Interfaz genérica para respuestas de la API de productos
 * 
 * Wrapper estándar para respuestas del backend con información
 * de éxito y mensajes descriptivos.
 * 
 * @template T - Tipo de datos contenidos en la respuesta
 */
export interface ApiResponse<T> {
  success: boolean;  // Indica si la operación fue exitosa
  message: string;   // Mensaje descriptivo de la respuesta
  data: T;          // Datos de la respuesta
}