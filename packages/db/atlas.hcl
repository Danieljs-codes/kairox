variable "database_url" {
	type    = string
	default = getenv("DATABASE_URL")
}

variable "dev_database_url" {
	type    = string
	default = getenv("DEV_DATABASE_URL")
}

env "local" {
	url = var.database_url
	dev = var.dev_database_url
	migration {
		dir = "file://migrations"
	}
}

env "production" {
	url = var.database_url
	dev = "docker://postgres/15/dev?search_path=public"
	migration {
		dir = "file://migrations"
	}
}
