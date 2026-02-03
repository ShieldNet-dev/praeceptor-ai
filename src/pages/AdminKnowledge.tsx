import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Upload, FileText, Video, Tag, Loader2, 
  Trash2, RefreshCw, CheckCircle, XCircle, Clock, Plus,
  Youtube, FileVideo, Captions, Files, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  status: ProcessingStatus;
  error_message: string | null;
  chunk_count: number;
  created_at: string;
}

interface KnowledgeVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  platform: string | null;
  caption_file_name: string | null;
  status: ProcessingStatus;
  error_message: string | null;
  chunk_count: number;
  created_at: string;
}

interface KnowledgeTag {
  id: string;
  name: string;
  color: string;
}

const StatusBadge = ({ status }: { status: ProcessingStatus }) => {
  const config = {
    pending: { icon: Clock, className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    processing: { icon: Loader2, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    completed: { icon: CheckCircle, className: "bg-green-500/20 text-green-400 border-green-500/30" },
    failed: { icon: XCircle, className: "bg-destructive/20 text-destructive border-destructive/30" },
  };
  const { icon: Icon, className } = config[status];
  return (
    <Badge variant="outline" className={className}>
      <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const AdminKnowledge = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Bulk upload states
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkSelectedTags, setBulkSelectedTags] = useState<string[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
    completed: string[];
    failed: { name: string; error: string }[];
  } | null>(null);
  
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [captionFile, setCaptionFile] = useState<File | null>(null);
  const [videoInputType, setVideoInputType] = useState<"url" | "caption">("url");
  
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#1ECBE1");

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setAdminChecked(true);
        return;
      }
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
      setAdminChecked(true);
    };
    checkAdmin();
  }, [user]);

  // Fetch documents
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['knowledge-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KnowledgeDocument[];
    },
    enabled: !!user && isAdmin && adminChecked,
  });

  // Fetch videos
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['knowledge-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KnowledgeVideo[];
    },
    enabled: !!user && isAdmin && adminChecked,
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['knowledge-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as KnowledgeTag[];
    },
    enabled: !!user && isAdmin && adminChecked,
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!docFile || !user) throw new Error("No file selected");
      
      setUploading(true);
      const fileExt = docFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('knowledge-documents')
        .upload(filePath, docFile);
      
      if (uploadError) throw uploadError;
      
      // Create document record
      const { data: doc, error: insertError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: docTitle,
          description: docDescription || null,
          file_name: docFile.name,
          file_type: docFile.type,
          file_size: docFile.size,
          storage_path: filePath,
          uploaded_by: user.id,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Add tags if selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          document_id: doc.id,
          tag_id: tagId,
        }));
        await supabase.from('knowledge_document_tags').insert(tagInserts);
      }
      
      // Trigger processing
      await supabase.functions.invoke('process-document', {
        body: { documentId: doc.id },
      });
      
      return doc;
    },
    onSuccess: () => {
      toast({ title: "Document uploaded", description: "Processing has started." });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      setUploadDialogOpen(false);
      resetDocForm();
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => setUploading(false),
  });

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      setUploading(true);
      let captionPath = null;
      
      // Upload caption file if provided
      if (captionFile) {
        const fileExt = captionFile.name.split('.').pop();
        captionPath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('knowledge-captions')
          .upload(captionPath, captionFile);
        
        if (uploadError) throw uploadError;
      }
      
      // Detect platform from URL
      let platform = null;
      if (videoUrl) {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          platform = 'youtube';
        } else if (videoUrl.includes('vimeo.com')) {
          platform = 'vimeo';
        }
      }
      
      // Create video record
      const { data: video, error: insertError } = await supabase
        .from('knowledge_videos')
        .insert({
          title: videoTitle,
          description: videoDescription || null,
          video_url: videoUrl || null,
          platform,
          caption_file_path: captionPath,
          caption_file_name: captionFile?.name || null,
          uploaded_by: user.id,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Trigger processing
      await supabase.functions.invoke('process-video', {
        body: { videoId: video.id },
      });
      
      return video;
    },
    onSuccess: () => {
      toast({ title: "Video added", description: "Processing has started." });
      queryClient.invalidateQueries({ queryKey: ['knowledge-videos'] });
      setVideoDialogOpen(false);
      resetVideoForm();
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => setUploading(false),
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_tags')
        .insert({ name: newTagName, color: newTagColor })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Tag created" });
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
      setTagDialogOpen(false);
      setNewTagName("");
      setNewTagColor("#1ECBE1");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create tag", description: error.message, variant: "destructive" });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      // Delete chunks first
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('source_type', 'document')
        .eq('source_id', docId);
      
      // Get storage path
      const { data: doc } = await supabase
        .from('knowledge_documents')
        .select('storage_path')
        .eq('id', docId)
        .single();
      
      if (doc?.storage_path) {
        await supabase.storage.from('knowledge-documents').remove([doc.storage_path]);
      }
      
      // Delete document record
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Document deleted" });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      // Delete chunks first
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('source_type', 'video')
        .eq('source_id', videoId);
      
      // Get caption path
      const { data: video } = await supabase
        .from('knowledge_videos')
        .select('caption_file_path')
        .eq('id', videoId)
        .single();
      
      if (video?.caption_file_path) {
        await supabase.storage.from('knowledge-captions').remove([video.caption_file_path]);
      }
      
      // Delete video record
      const { error } = await supabase
        .from('knowledge_videos')
        .delete()
        .eq('id', videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Video deleted" });
      queryClient.invalidateQueries({ queryKey: ['knowledge-videos'] });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  // Reprocess mutation
  const reprocessMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'document' | 'video' }) => {
      const endpoint = type === 'document' ? 'process-document' : 'process-video';
      const body = type === 'document' ? { documentId: id } : { videoId: id };
      
      // Update status to pending
      const table = type === 'document' ? 'knowledge_documents' : 'knowledge_videos';
      await supabase
        .from(table)
        .update({ status: 'pending' as ProcessingStatus, error_message: null })
        .eq('id', id);
      
      await supabase.functions.invoke(endpoint, { body });
    },
    onSuccess: (_, { type }) => {
      toast({ title: "Reprocessing started" });
      queryClient.invalidateQueries({ 
        queryKey: [type === 'document' ? 'knowledge-documents' : 'knowledge-videos'] 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Reprocess failed", description: error.message, variant: "destructive" });
    },
  });

  const resetDocForm = () => {
    setDocTitle("");
    setDocDescription("");
    setDocFile(null);
    setSelectedTags([]);
  };

  const resetVideoForm = () => {
    setVideoTitle("");
    setVideoDescription("");
    setVideoUrl("");
    setCaptionFile(null);
    setVideoInputType("url");
  };

  const resetBulkForm = () => {
    setBulkFiles([]);
    setBulkSelectedTags([]);
    setBulkUploadProgress(null);
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBulkFiles(files);
  };

  const removeFileFromBulk = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (!user || bulkFiles.length === 0) return;
    
    setUploading(true);
    setBulkUploadProgress({
      current: 0,
      total: bulkFiles.length,
      currentFileName: bulkFiles[0].name,
      completed: [],
      failed: [],
    });

    const completed: string[] = [];
    const failed: { name: string; error: string }[] = [];

    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];
      setBulkUploadProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        currentFileName: file.name,
      } : null);

      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${i}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('knowledge-documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Use filename as title (without extension)
        const title = file.name.replace(/\.[^/.]+$/, "");
        
        // Create document record
        const { data: doc, error: insertError } = await supabase
          .from('knowledge_documents')
          .insert({
            title,
            description: null,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            uploaded_by: user.id,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Add tags if selected
        if (bulkSelectedTags.length > 0) {
          const tagInserts = bulkSelectedTags.map(tagId => ({
            document_id: doc.id,
            tag_id: tagId,
          }));
          await supabase.from('knowledge_document_tags').insert(tagInserts);
        }
        
        // Trigger processing (don't await - let it run in background)
        supabase.functions.invoke('process-document', {
          body: { documentId: doc.id },
        });
        
        completed.push(file.name);
        setBulkUploadProgress(prev => prev ? { ...prev, completed: [...completed] } : null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ name: file.name, error: errorMessage });
        setBulkUploadProgress(prev => prev ? { ...prev, failed: [...failed] } : null);
      }
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    
    if (failed.length === 0) {
      toast({ 
        title: "All documents uploaded", 
        description: `${completed.length} files uploaded successfully.` 
      });
      setBulkUploadDialogOpen(false);
      resetBulkForm();
    } else if (completed.length > 0) {
      toast({ 
        title: "Partial upload complete", 
        description: `${completed.length} succeeded, ${failed.length} failed.`,
        variant: "destructive"
      });
    } else {
      toast({ 
        title: "Upload failed", 
        description: `All ${failed.length} files failed to upload.`,
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (authLoading || !adminChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Knowledge Base</h1>
              <p className="text-sm text-muted-foreground">Manage learning materials for RAG</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="w-4 h-4 mr-2" />
                  Manage Tags
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Tag Name</Label>
                    <Input 
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="e.g., Network Security"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <p className="text-sm text-muted-foreground w-full mb-2">Existing tags:</p>
                    {tags.map(tag => (
                      <Badge 
                        key={tag.id} 
                        style={{ backgroundColor: tag.color + '30', borderColor: tag.color }}
                        variant="outline"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-muted-foreground">No tags yet</p>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => createTagMutation.mutate()}
                    disabled={!newTagName.trim() || createTagMutation.isPending}
                  >
                    {createTagMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Tag
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/40">
                  <Video className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{videos.length}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.status === 'completed').length + 
                     videos.filter(v => v.status === 'completed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Tag className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tags.length}</p>
                  <p className="text-xs text-muted-foreground">Tags</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="documents" className="flex-1 sm:flex-none">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex-1 sm:flex-none">
                <Video className="w-4 h-4 mr-2" />
                Videos
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 sm:flex-none">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload Learning Material</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input 
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g., Network Security Fundamentals"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={docDescription}
                        onChange={(e) => setDocDescription(e.target.value)}
                        placeholder="Brief description of the content..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>File (PDF, DOCX, TXT) *</Label>
                      <Input 
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {docFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {docFile.name} ({formatFileSize(docFile.size)})
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <Badge 
                            key={tag.id}
                            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            style={{ 
                              backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                              borderColor: tag.color,
                              color: selectedTags.includes(tag.id) ? '#fff' : tag.color,
                            }}
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(tag.id) 
                                  ? prev.filter(id => id !== tag.id)
                                  : [...prev, tag.id]
                              );
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {tags.length === 0 && (
                          <p className="text-sm text-muted-foreground">No tags available</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => uploadDocumentMutation.mutate()}
                      disabled={!docTitle.trim() || !docFile || uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload & Process
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={bulkUploadDialogOpen} onOpenChange={(open) => {
                if (!uploading) {
                  setBulkUploadDialogOpen(open);
                  if (!open) resetBulkForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Files className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Documents</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {!bulkUploadProgress ? (
                      <>
                        <div className="space-y-2">
                          <Label>Select Files (PDF, DOCX, TXT)</Label>
                          <Input 
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            multiple
                            onChange={handleBulkFileSelect}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            File names will be used as document titles
                          </p>
                        </div>
                        
                        {bulkFiles.length > 0 && (
                          <div className="space-y-2">
                            <Label>Selected Files ({bulkFiles.length})</Label>
                            <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-border p-2">
                              {bulkFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between gap-2 text-sm py-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-muted-foreground shrink-0">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => removeFileFromBulk(index)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Apply Tags to All</Label>
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                              <Badge 
                                key={tag.id}
                                variant={bulkSelectedTags.includes(tag.id) ? "default" : "outline"}
                                className="cursor-pointer transition-colors"
                                style={{ 
                                  backgroundColor: bulkSelectedTags.includes(tag.id) ? tag.color : 'transparent',
                                  borderColor: tag.color,
                                  color: bulkSelectedTags.includes(tag.id) ? '#fff' : tag.color,
                                }}
                                onClick={() => {
                                  setBulkSelectedTags(prev => 
                                    prev.includes(tag.id) 
                                      ? prev.filter(id => id !== tag.id)
                                      : [...prev, tag.id]
                                  );
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {tags.length === 0 && (
                              <p className="text-sm text-muted-foreground">No tags available</p>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={handleBulkUpload}
                          disabled={bulkFiles.length === 0 || uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {bulkFiles.length} Document{bulkFiles.length !== 1 ? 's' : ''}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{bulkUploadProgress.current} / {bulkUploadProgress.total}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(bulkUploadProgress.current / bulkUploadProgress.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            Current: {bulkUploadProgress.currentFileName}
                          </p>
                        </div>
                        
                        {bulkUploadProgress.completed.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-green-400">Completed ({bulkUploadProgress.completed.length})</Label>
                            <div className="max-h-20 overflow-y-auto text-sm space-y-1">
                              {bulkUploadProgress.completed.map((name, i) => (
                                <div key={i} className="flex items-center gap-2 text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="truncate">{name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {bulkUploadProgress.failed.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-destructive">Failed ({bulkUploadProgress.failed.length})</Label>
                            <div className="max-h-20 overflow-y-auto text-sm space-y-1">
                              {bulkUploadProgress.failed.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-destructive">
                                  <XCircle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{item.name}: {item.error}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {!uploading && (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => {
                              setBulkUploadDialogOpen(false);
                              resetBulkForm();
                            }}
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Video className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Video Learning Source</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input 
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="e.g., Introduction to Ethical Hacking"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        placeholder="Brief description of the video content..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Source Type</Label>
                      <Select value={videoInputType} onValueChange={(v: "url" | "caption") => setVideoInputType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="url">
                            <div className="flex items-center">
                              <Youtube className="w-4 h-4 mr-2" />
                              Video URL (YouTube, etc.)
                            </div>
                          </SelectItem>
                          <SelectItem value="caption">
                            <div className="flex items-center">
                              <Captions className="w-4 h-4 mr-2" />
                              Caption File (.srt, .vtt)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {videoInputType === "url" ? (
                      <div className="space-y-2">
                        <Label>Video URL *</Label>
                        <Input 
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Supports YouTube and other platforms with available transcripts
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Caption File (.srt, .vtt) *</Label>
                        <Input 
                          type="file"
                          accept=".srt,.vtt"
                          onChange={(e) => setCaptionFile(e.target.files?.[0] || null)}
                          className="cursor-pointer"
                        />
                        {captionFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {captionFile.name}
                          </p>
                        )}
                        <div className="space-y-2 mt-2">
                          <Label>Video URL (optional)</Label>
                          <Input 
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Link to the original video"
                          />
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={() => uploadVideoMutation.mutate()}
                      disabled={
                        !videoTitle.trim() || 
                        (videoInputType === "url" && !videoUrl.trim()) ||
                        (videoInputType === "caption" && !captionFile) ||
                        uploading
                      }
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <FileVideo className="w-4 h-4 mr-2" />
                      )}
                      Add & Process
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {docsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">No documents uploaded yet</p>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Upload PDF, DOCX, or TXT files to build your knowledge base
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documents.map(doc => (
                  <Card key={doc.id} className="bg-card/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{doc.file_name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <StatusBadge status={doc.status} />
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                              {doc.chunk_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  • {doc.chunk_count} chunks
                                </span>
                              )}
                            </div>
                            {doc.error_message && (
                              <p className="text-sm text-red-400 mt-2">{doc.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(doc.status === 'failed' || doc.status === 'completed') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => reprocessMutation.mutate({ id: doc.id, type: 'document' })}
                              disabled={reprocessMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteDocumentMutation.mutate(doc.id)}
                            disabled={deleteDocumentMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            {videosLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : videos.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">No videos added yet</p>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Add YouTube URLs or upload caption files
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {videos.map(video => (
                  <Card key={video.id} className="bg-card/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-secondary/40 shrink-0">
                            {video.platform === 'youtube' ? (
                              <Youtube className="w-5 h-5 text-red-400" />
                            ) : video.caption_file_name ? (
                              <Captions className="w-5 h-5 text-secondary-foreground" />
                            ) : (
                              <Video className="w-5 h-5 text-secondary-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                            {video.video_url && (
                              <a 
                                href={video.video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline truncate block"
                              >
                                {video.video_url}
                              </a>
                            )}
                            {video.caption_file_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                Caption: {video.caption_file_name}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <StatusBadge status={video.status} />
                              {video.chunk_count > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {video.chunk_count} chunks
                                </span>
                              )}
                            </div>
                            {video.error_message && (
                              <p className="text-sm text-red-400 mt-2">{video.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(video.status === 'failed' || video.status === 'completed') && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => reprocessMutation.mutate({ id: video.id, type: 'video' })}
                              disabled={reprocessMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteVideoMutation.mutate(video.id)}
                            disabled={deleteVideoMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminKnowledge;
