# Library REST API Design

A RESTful API design for managing books in a library system.

## Endpoints

### 1. List All Books

- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Retrieves a list of all books in the library inventory.
- **Request Body:** None
- **Success Status Code:** `200 OK`

### 2. Get a Single Book

- **Method:** `GET`
- **Path:** `/api/books/:id`
- **Description:** Retrieves detailed information for a specific book by its unique ID.
- **Request Body:** None
- **Success Status Code:** `200 OK`

### 3. Create a New Book

- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Adds a new book entry into the library catalog.
- **Request Body Example:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "publishedYear": 2008,
    "genre": "Programming"
  }
  ```
- **Success Status Code:** `201 Created`

### 4. Update an Existing Book

- **Method:** `PUT`
- **Path:** `/api/books/:id`
- **Description:** Updates all or specific details of an existing book by its ID
- **Request Body Example:**

```json
{
  "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
  "author": "Robert C. Martin",
  "publishedYear": 2008,
  "genre": "Software Engineering"
}
* **Success Status Code:** `200 OK`

### 5. Delete a Book
* **Method:** `DELETE`
* **Path:** `/api/books/:id`
* **Description:** Removes a book record from the library catalog by its ID.
* **Request Body:** None
* **Success Status Code:** `204 No Content`

### 6. List Books by an Author(Query Parameter)
* **Method:** `GET`
* **Path:** `/api/books?author=Orwell`
* **Description:** Filters and retrieves a list of books written by a specific author using query parameters
* **Request Body:** None
* **Success Status Code:** `200 OK`
```

### Common Error Codes

- **400 Bad Request**
- ** When it happens:** Triggered when the client sends malformed JSON syntax or omits required validation fields during a POST or PUT request.
- **Example:** Sending a POST /api/books request with an empty body or missing the mandatory title and author fields.

- **404 Not Found**
- **When it happens:** Triggered when the requested resource path or unique identifier does not exist in the server database.
- **Example:** GET /api/books/99999 for a book ID that has not been created or has already been deleted.
