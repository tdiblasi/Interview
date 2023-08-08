using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Globalization;
using CsvHelper;
using System.Text.Json;

namespace interview_app.Controllers;

[ApiController]
[Route("[controller]")]
public class DocsController : ControllerBase
{
    private static readonly string documentsDir = Path.Combine(Directory.GetCurrentDirectory(), "Documents");
    private static readonly string documentsCsvPath = Path.Combine(documentsDir, "Documents.csv");
    private static readonly string foldersCsvPath = Path.Combine(documentsDir, "Folders.csv");

    private readonly ILogger<DocsController> _logger;

    // Deserialize path json
    private class PathString
    {
        public string? Path { get; set; }
    }

    // Deserialize doc data json
    private class DocData
    {
        public string? FileData { get; set; }
        public string? Path { get; set; }
        public string? Name { get; set; }
    }

    public DocsController(ILogger<DocsController> logger)
    {
        _logger = logger;
    }

    // Get all folders and contents
    [HttpGet]
    public IEnumerable<string> Get()
    {
        List<Folder> foldersList = new();
        // Read all folders
        using (var foldersReader = new StreamReader(foldersCsvPath))
        using (var foldersCsv = new CsvReader(foldersReader, CultureInfo.InvariantCulture))
        {
            var folders = foldersCsv.GetRecords<Folder>();
            foreach (Folder folder in folders)
            {
                folder.MyDocs = new List<Doc>();
                foldersList.Add(folder);
            }
        }
        // Read all documents
        using (var docsReader = new StreamReader(documentsCsvPath))
        using (var docsCsv = new CsvReader(docsReader, CultureInfo.InvariantCulture))
        {
            var docs = docsCsv.GetRecords<Doc>();
            foreach (Doc doc in docs)
            {
                // Add doc to correct folder
                foreach (Folder folder in foldersList)
                {
                    if (folder is not null
                       && folder.Category is not null
                       && folder.MyDocs is not null
                    )
                    {
                        if (folder.Category.Equals(doc.Category))
                        {
                            folder.MyDocs.Add(doc);
                            break;
                        }
                    }
                    
                }
            }
        }
        // Return folders and their docs
        yield return JsonSerializer.Serialize(foldersList);
    }

    // Receive and save PDF file
    [HttpPost("uploadpdf")]
    public IActionResult UploadPdf([FromBody] JsonElement body)
    {
        DocData? docData = JsonSerializer.Deserialize<DocData>(body);
        // Return bad request if missing a value
        if (docData is null
            || docData.Path is null
            || docData.Name is null
            || docData.FileData is null)
        {
            return BadRequest("File upload data not properly formatted");
        }
        // Return bad request if not PDF
        if (!docData.Name.EndsWith(".pdf"))
        {
            return BadRequest("File must be a PDF file");
        }
        string fullPath = Path.Combine(docData.Path, docData.Name);
        // Select category
        string category = "Other File";
        if(fullPath.StartsWith("Docs" + Path.DirectorySeparatorChar + "SD"))
        {
            category = "Supporting Document"; 
        } else if (fullPath.StartsWith("Docs" + Path.DirectorySeparatorChar + "SIG"))
        {
            category = "Signature";
        }
        // Create file writer
        using FileStream stream = System.IO.File.Create(Path.Combine(documentsDir, fullPath));
        // Remove leading data so Base64 can be decoded
        if (docData.FileData[..5].Equals("data:"))
        {
            docData.FileData = docData.FileData[(docData.FileData.IndexOf(',') + 1)..];
        }
        // Decode file data
        System.Byte[] byteArray = System.Convert.FromBase64String(docData.FileData);
        // Write new file
        stream.Write(byteArray, 0, byteArray.Length);
        var docsList = new List<Doc>();
        int newIndex = 0;
        bool fileAlreadyExists = false;
        // Read Documents.csv
        using (var docsReader = new StreamReader(documentsCsvPath))
        using (var docsCsvReader = new CsvReader(docsReader, CultureInfo.InvariantCulture))
        {
            var docs = docsCsvReader.GetRecords<Doc>();
            var indexList = new List<int>();
            foreach (Doc doc in docs)
            {
                // Add all docs
                docsList.Add(doc);
                if (doc.Category is null || doc.Name is null)
                {
                    continue;
                }
                // Check if file exists
                if (doc.Path is not null && !fileAlreadyExists && doc.Path.Equals(fullPath))
                {
                    fileAlreadyExists = true;
                }
                // Save used indexes of this category
                if (doc.Category.Equals(category + "s"))
                {
                    if (doc.Name.Length > doc.Category.Length &&
                        Int32.TryParse(doc.Name.AsSpan(category.Length + 1), out int i))
                    {
                        indexList.Add(i);
                    }
                }
            }
            // Find lowest index not used by category
            for (int i = 1; i < Int32.MaxValue; i++)
            {
                if (i == 1 && category.Equals("Signature"))
                {
                    continue;
                }
                if (!indexList.Contains(i))
                {
                    newIndex = i;
                    break;
                }
            }
        }
        // Create new doc csv entry
        Doc newDoc = new()
        {
            Name = category + " " + newIndex,
            Path = fullPath,
            Category = category + 's'
        };
        if (!fileAlreadyExists)
        {
            docsList.Add(newDoc);
        }
        // Write new csv data
        using var docsWriter = new StreamWriter(documentsCsvPath);
        using var docsCsvWriter = new CsvWriter(docsWriter, CultureInfo.InvariantCulture);
        docsCsvWriter.WriteRecords(docsList);
        return Ok(newDoc);
    }


    // Download a pdf
    [HttpPost("downloadpdf")]
    public IActionResult  DownloadPdf([FromBody] JsonElement body)
    {
        PathString? pathObj = JsonSerializer.Deserialize<PathString>(body);
        // Return bad request if path is not valid
        if (pathObj is null || pathObj.Path is null)
        {
            return BadRequest(body);
        }
        string filepath = Path.Combine(documentsDir, pathObj.Path);
        // Handle file not found
        if (!System.IO.File.Exists(filepath))
        {
            return NotFound();
        }
        // Generate response
        var fileInfo = new System.IO.FileInfo(filepath);
        Response.ContentType = "application/pdf";
        Response.Headers.Add("Content-Disposition", "attachment;filename=\"" + fileInfo.Name + "\"");
        Response.Headers.Add("Content-Length", fileInfo.Length.ToString());
        return File(System.IO.File.ReadAllBytes(filepath), "application/pdf", fileInfo.Name);
    }

    // Handle doc deletion
    [HttpDelete]
    public IActionResult DeletePdf(string name)
    {
        // Decode name
        string decodedName = Uri.UnescapeDataString(name);
        var docsList = new List<Doc>();
        Doc? toDelete = null;
        // Search csv for doc
        using (var docsReader = new StreamReader(documentsCsvPath))
        using (var docsCsvReader = new CsvReader(docsReader, CultureInfo.InvariantCulture))
        {
            var docs = docsCsvReader.GetRecords<Doc>();
            foreach (Doc doc in docs) {
                if (doc.Path is not null) {
                    if ( doc.Path.Equals(decodedName))
                    {
                        toDelete = doc;
                    } else
                    {
                        docsList.Add(doc);
                    }
                }
            }
        }
        if (toDelete is null || toDelete.Path is null)
        {
            return NotFound();
        }
        else
        {
            using (var docsWriter = new StreamWriter(documentsCsvPath))
            using (var docsCsvWriter = new CsvWriter(docsWriter, CultureInfo.InvariantCulture))
            {
                docsCsvWriter.WriteRecords(docsList);
            }
            System.IO.File.Delete(Path.Combine(documentsDir, toDelete.Path));
            return Ok(toDelete);
        }
    }
}