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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Upload, FileText, Video, Tag, Loader2, 
  Trash2, RefreshCw, CheckCircle, XCircle, Clock, Plus,
  Youtube, FileVideo, Captions, Files, X, AlertCircle
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
    pending: { icon: Clock, label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    processing: { icon: Loader2, label: "Processing", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    completed: { icon: CheckCircle, label: "Completed", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    failed: { icon: XCircle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      <Icon className={`w-3 h-3 mr-1.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
      
      const { error: uploadError } = await supabase.storage
        .from('knowledge-documents')
        .upload(filePath, docFile);
      
      if (uploadError) throw uploadError;
      
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
      
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          document_id: doc.id,
          tag_id: tagId,
        }));
        await supabase.from('knowledge_document_tags').insert(tagInserts);
      }
      
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
      
      if (captionFile) {
        const fileExt = captionFile.name.split('.').pop();
        captionPath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('knowledge-captions')
          .upload(captionPath, captionFile);
        
        if (uploadError) throw uploadError;
      }
      
      let platform = null;
      if (videoUrl) {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          platform = 'youtube';
        } else if (videoUrl.includes('vimeo.com')) {
          platform = 'vimeo';
        }
      }
      
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
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('source_type', 'document')
        .eq('source_id', docId);
      
      const { data: doc } = await supabase
        .from('knowledge_documents')
        .select('storage_path')
        .eq('id', docId)
        .single();
      
      if (doc?.storage_path) {
        await supabase.storage.from('knowledge-documents').remove([doc.storage_path]);
      }
      
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
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('source_type', 'video')
        .eq('source_id', videoId);
      
      const { data: video } = await supabase
        .from('knowledge_videos')
        .select('caption_file_path')
        .eq('id', videoId)
        .single();
      
      if (video?.caption_file_path) {
        await supabase.storage.from('knowledge-captions').remove([video.caption_file_path]);
      }
      
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
        
        const { error: uploadError } = await supabase.storage
          .from('knowledge-documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const title = file.name.replace(/\.[^/.]+$/, "");
        
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
        
        if (bulkSelectedTags.length > 0) {
          const tagInserts = bulkSelectedTags.map(tagId => ({
            document_id: doc.id,
            tag_id: tagId,
          }));
          await supabase.from('knowledge_document_tags').insert(tagInserts);
        }
        
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

  const progressPercentage = bulkUploadProgress 
    ? (bulkUploadProgress.current / bulkUploadProgress.total) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0 h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground">Manage RAG learning materials</p>
          </div>
          <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Existing tags</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <Badge 
                          key={tag.id} 
                          style={{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-secondary/20">
                <Video className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videos.length}</p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.status === 'completed').length + 
                   videos.filter(v => v.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10">
                <Tag className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tags.length}</p>
                <p className="text-xs text-muted-foreground">Tags</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <div className="flex flex-col gap-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="w-4 h-4" />
                Videos
              </TabsTrigger>
            </TabsList>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 sm:flex-none">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg mx-4 sm:mx-auto">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
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
                        placeholder="Brief description..."
                        rows={2}
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
                        <p className="text-xs text-muted-foreground">
                          {docFile.name} ({formatFileSize(docFile.size)})
                        </p>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(tag => (
                            <Badge 
                              key={tag.id}
                              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
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
                        </div>
                      </div>
                    )}
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
                    Bulk
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg mx-4 sm:mx-auto">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {!bulkUploadProgress ? (
                      <>
                        <div className="space-y-2">
                          <Label>Select Files</Label>
                          <Input 
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            multiple
                            onChange={handleBulkFileSelect}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Supports PDF, DOCX, TXT • Filenames become titles
                          </p>
                        </div>
                        
                        {bulkFiles.length > 0 && (
                          <div className="space-y-2">
                            <Label>Selected ({bulkFiles.length})</Label>
                            <ScrollArea className="h-32 rounded-lg border border-border bg-muted/30">
                              <div className="p-2 space-y-1">
                                {bulkFiles.map((file, index) => (
                                  <div 
                                    key={index} 
                                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-background/50"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <span className="text-sm truncate">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs text-muted-foreground">
                                        {formatFileSize(file.size)}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => removeFileFromBulk(index)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                        
                        {tags.length > 0 && (
                          <div className="space-y-2">
                            <Label>Apply Tags to All</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map(tag => (
                                <Badge 
                                  key={tag.id}
                                  variant={bulkSelectedTags.includes(tag.id) ? "default" : "outline"}
                                  className="cursor-pointer text-xs"
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
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full" 
                          onClick={handleBulkUpload}
                          disabled={bulkFiles.length === 0 || uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {bulkFiles.length} File{bulkFiles.length !== 1 ? 's' : ''}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Uploading...</span>
                            <span className="text-muted-foreground">
                              {bulkUploadProgress.current} / {bulkUploadProgress.total}
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          <p className="text-xs text-muted-foreground truncate">
                            {bulkUploadProgress.currentFileName}
                          </p>
                        </div>
                        
                        {bulkUploadProgress.completed.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-green-500 text-xs">
                              Completed ({bulkUploadProgress.completed.length})
                            </Label>
                            <ScrollArea className="h-20 rounded-md border border-green-500/20 bg-green-500/5">
                              <div className="p-2 space-y-1">
                                {bulkUploadProgress.completed.map((name, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-green-500">
                                    <CheckCircle className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{name}</span>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                        
                        {bulkUploadProgress.failed.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-destructive text-xs">
                              Failed ({bulkUploadProgress.failed.length})
                            </Label>
                            <ScrollArea className="h-20 rounded-md border border-destructive/20 bg-destructive/5">
                              <div className="p-2 space-y-1">
                                {bulkUploadProgress.failed.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                                    <XCircle className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
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
                    Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg mx-4 sm:mx-auto">
                  <DialogHeader>
                    <DialogTitle>Add Video</DialogTitle>
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
                        placeholder="Brief description..."
                        rows={2}
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
                            <div className="flex items-center gap-2">
                              <Youtube className="w-4 h-4" />
                              Video URL
                            </div>
                          </SelectItem>
                          <SelectItem value="caption">
                            <div className="flex items-center gap-2">
                              <Captions className="w-4 h-4" />
                              Caption File
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
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        <p className="text-xs text-muted-foreground">
                          YouTube and platforms with transcripts
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Caption File (.srt, .vtt) *</Label>
                          <Input 
                            type="file"
                            accept=".srt,.vtt"
                            onChange={(e) => setCaptionFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                          />
                          {captionFile && (
                            <p className="text-xs text-muted-foreground">
                              {captionFile.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Video URL (optional)</Label>
                          <Input 
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Original video link"
                          />
                        </div>
                      </>
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

              {/* Mobile tag button */}
              <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:hidden">
                    <Tag className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-3 mt-0">
            {docsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">No documents yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Upload PDF, DOCX, or TXT files to build your knowledge base
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <Card key={doc.id} className="bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-foreground leading-tight line-clamp-1">
                              {doc.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              {(doc.status === 'failed' || doc.status === 'completed') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => reprocessMutation.mutate({ id: doc.id, type: 'document' })}
                                  disabled={reprocessMutation.isPending}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                disabled={deleteDocumentMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={doc.status} />
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                            {doc.chunk_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                • {doc.chunk_count} chunks
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              • {formatDate(doc.created_at)}
                            </span>
                          </div>
                          {doc.error_message && (
                            <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-destructive/10">
                              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                              <p className="text-xs text-destructive line-clamp-2">{doc.error_message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-3 mt-0">
            {videosLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : videos.length === 0 ? (
              <Card className="bg-card/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">No videos yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Add YouTube URLs or upload caption files
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {videos.map(video => (
                  <Card key={video.id} className="bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-secondary/20 shrink-0 mt-0.5">
                          {video.platform === 'youtube' ? (
                            <Youtube className="w-4 h-4 text-red-500" />
                          ) : video.caption_file_name ? (
                            <Captions className="w-4 h-4 text-secondary-foreground" />
                          ) : (
                            <Video className="w-4 h-4 text-secondary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-foreground leading-tight line-clamp-1">
                              {video.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              {(video.status === 'failed' || video.status === 'completed') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => reprocessMutation.mutate({ id: video.id, type: 'video' })}
                                  disabled={reprocessMutation.isPending}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteVideoMutation.mutate(video.id)}
                                disabled={deleteVideoMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {video.video_url && (
                            <a 
                              href={video.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate block"
                            >
                              {video.video_url}
                            </a>
                          )}
                          {video.caption_file_name && !video.video_url && (
                            <p className="text-xs text-muted-foreground truncate">
                              Caption: {video.caption_file_name}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={video.status} />
                            {video.chunk_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {video.chunk_count} chunks
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              • {formatDate(video.created_at)}
                            </span>
                          </div>
                          {video.error_message && (
                            <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-destructive/10">
                              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                              <p className="text-xs text-destructive line-clamp-2">{video.error_message}</p>
                            </div>
                          )}
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
